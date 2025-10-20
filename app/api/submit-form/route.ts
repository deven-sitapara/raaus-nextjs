import { NextRequest, NextResponse } from "next/server";
import { ZohoCRM } from "@/lib/zoho/crm";
import { ZohoWorkDrive } from "@/lib/zoho/workdrive";
import { AccidentFormData, DefectFormData, ComplaintFormData, HazardFormData } from "@/types/forms";

type FormData = AccidentFormData | DefectFormData | ComplaintFormData | HazardFormData;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    // Extract and validate form type and data
    const formType = formData.get('formType') as string;
    const formDataJson = formData.get('formData') as string;
    
    if (!formType || !formDataJson) {
      return NextResponse.json(
        { 
          success: false,
          error: "Missing form type or form data",
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    // Parse and validate JSON data
    let data: FormData;
    try {
      data = JSON.parse(formDataJson);
    } catch (parseError: any) {
      return NextResponse.json(
        { 
          success: false,
          error: "Invalid JSON data",
          details: parseError.message,
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    // Extract user attachment files - only include actual File objects with valid names and content
    const files: File[] = [];
    formData.forEach((value, key) => {
      if (key.startsWith('file_') && value instanceof File) {
        // Strict validation to ensure it's a real file with content
        const isValidFile = (
          value.size > 0 && // Must have content
          value.name && // Must have a name
          value.name !== 'undefined' && // Name can't be 'undefined'
          value.name !== 'null' && // Name can't be 'null'
          value.name.trim() !== '' && // Name can't be empty
          value.type && // Must have a MIME type
          value.type !== '' && // MIME type can't be empty
          value.name.includes('.') && // Must have a file extension
          value.name.length > 3 // Reasonable minimum filename length (e.g., "a.b")
        );
        
        if (isValidFile) {
          files.push(value);
        }
      }
    });

    // Validate required fields based on form type
    const validationResult = validateFormData(formType, data);
    if (!validationResult.isValid) {
      return NextResponse.json(
        { 
          success: false,
          error: "Form validation failed",
          details: validationResult.errors,
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }
    
    // Create CRM record
    const recordId = await createCRMRecord(formType, data);
    
    if (!recordId) {
      throw new Error("CRM record creation returned undefined recordId");
    }
    
    // Fetch occurrence ID and handle WorkDrive operations (including user attachments)
    const result = await handleOccurrenceIdAndWorkDrive(formType, recordId, files);
    
    // Return success response with form data for PDF generation
    const response = {
      success: true,
      message: `${formType} form processed successfully`,
      recordId,
      ...result,
      userAttachmentsProcessed: files.length,
      userAttachmentsList: files.map(f => ({ name: f.name, size: f.size, type: f.type })),
      timestamp: new Date().toISOString(),
      // Include form data and metadata for PDF generation
      formData: data,
      formType: formType,
      metadata: {
        occurrenceId: result.occurrenceId,
        recordId: recordId,
        timestamp: new Date().toISOString(),
        attachmentCount: files.length,
      },
    };

    return NextResponse.json(response);

  } catch (error: any) {
    // Return detailed error information
    return NextResponse.json(
      { 
        success: false,
        error: error.message || "Failed to process form submission",
        errorType: error.constructor.name,
        errorStack: error.stack,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * Create CRM record with error handling
 */
async function createCRMRecord(formType: string, data: FormData): Promise<string> {
  try {
    let crmData = await prepareCRMData(formType, data);
    
    // Final cleanup: drop empty/placeholder values to prevent INVALID_DATA
    crmData = cleanupCRMRecord(crmData);
    
    // Validate CRM data before sending
    validateCRMData(crmData);
    
    let crmResponse = await ZohoCRM.createRecord("Occurrence_Management", crmData);
    
    if (!crmResponse.data || crmResponse.data.length === 0) {
      throw new Error("CRM API returned empty response");
    }

    // Handle different possible response structures
    let recordId;
    const firstRecord = crmResponse.data[0];
    
    if (firstRecord.details && firstRecord.details.id) {
      recordId = firstRecord.details.id;
    } else if (firstRecord.code === "SUCCESS" && firstRecord.details && firstRecord.details.id) {
      recordId = firstRecord.details.id;
    } else if (firstRecord.status === "success" && firstRecord.details && firstRecord.details.id) {
      recordId = firstRecord.details.id;
    } else {
      // Check if it's an error response
      if (firstRecord.code && firstRecord.code !== "SUCCESS") {
        // Auto-correct boolean field mismatches and retry once
        try {
          const details: any = (firstRecord as any).details || {};
          if (
            firstRecord.code === 'INVALID_DATA' &&
            details.expected_data_type === 'boolean' &&
            details.api_name &&
            crmData.hasOwnProperty(details.api_name) &&
            typeof crmData[details.api_name] !== 'boolean'
          ) {
            const apiName = details.api_name as string;
            const originalVal = crmData[apiName];
            const correctedVal = convertToBoolean(originalVal);
            crmData[apiName] = correctedVal;
            crmResponse = await ZohoCRM.createRecord("Occurrence_Management", crmData);

            const retryFirst = crmResponse.data && crmResponse.data[0];
            if (retryFirst && retryFirst.details && retryFirst.details.id) {
              recordId = retryFirst.details.id;
              return recordId;
            }
            // If still failing, throw with the latest error details for clarity
            if (retryFirst && retryFirst.code && retryFirst.code !== 'SUCCESS') {
              const retryMsg = retryFirst.message || 'Unknown error after retry';
              const retryDetails: any = (retryFirst as any).details || {};
              const retryApi = retryDetails.api_name || retryDetails.field_api_name || 'unknown_field';
              throw new Error(`CRM API error after retry: ${retryFirst.code} - ${retryMsg} (field: ${retryApi})`);
            }
          }
        } catch (autoErr) {
          // Auto-correct failed, continue with original error
        }

        // Extract detailed error information
        const errorDetails: any = (firstRecord as any).details || {};
        const fieldInfo = errorDetails.api_name || errorDetails.field_api_name || errorDetails.field || 'unknown_field';
        const expectedType = errorDetails.expected_data_type || 'unknown';
        const receivedValue = errorDetails.value !== undefined ? JSON.stringify(errorDetails.value) : 'unknown';
        
        throw new Error(
          `CRM API error: ${firstRecord.code} - ${firstRecord.message || 'Unknown error'}\n` +
          `Field: ${fieldInfo}\n` +
          `Expected type: ${expectedType}\n` +
          `Received value: ${receivedValue}\n` +
          `Details: ${JSON.stringify(errorDetails)}`
        );
      }
      
      // If we can't find the record ID in response
      console.error('Unexpected CRM response structure:', JSON.stringify(firstRecord, null, 2));
      throw new Error(`Could not extract record ID from CRM response.`);
    }
    
    return recordId;
  } catch (crmError: any) {
    console.error('CRM Error Details:', {
      message: crmError.message,
      response: crmError.response?.data,
      status: crmError.response?.status
    });
    throw new Error(`Failed to create CRM record: ${crmError.message}`);
  }
}

/**
 * Handle occurrence ID fetching and WorkDrive operations
 */
async function handleOccurrenceIdAndWorkDrive(
  formType: string, 
  recordId: string,
  userAttachments: File[] = []
): Promise<{
  occurrenceId: string | null;
  workdriveFolder: string | null;
  attachments: any[];
  attachmentCount: number;
  warning?: string;
}> {
  // Fetch OccurrenceId with retry logic
  const occurrenceId = await ZohoCRM.fetchOccurrenceId("Occurrence_Management", recordId, 5, 2000);
  
  if (!occurrenceId) {
    return {
      occurrenceId: null,
      workdriveFolder: null,
      attachments: [],
      attachmentCount: 0,
      warning: "OccurrenceId not generated, files not uploaded to WorkDrive"
    };
  }

  // Validate occurrence ID format before proceeding with WorkDrive
  const isValidOccurrenceId = occurrenceId && 
                             typeof occurrenceId === 'string' && 
                             occurrenceId.trim().startsWith('OCC') && 
                             occurrenceId.trim().length >= 5;

  if (!isValidOccurrenceId) {
    return {
      occurrenceId,
      workdriveFolder: null,
      attachments: [],
      attachmentCount: 0,
      warning: "Invalid occurrence ID format, files not uploaded"
    };
  }

  const parentFolderId = process.env.ZOHO_WORKDRIVE_PARENT_FOLDER_ID;
  if (!parentFolderId) {
    return {
      occurrenceId,
      workdriveFolder: null,
      attachments: [],
      attachmentCount: 0,
      warning: "WorkDrive not configured, files not uploaded"
    };
  }

  let workdriveFolderId = null;
  let attachmentResults: any[] = [];

  try {
    // Create/ensure OccurrenceId subfolder
    workdriveFolderId = await ZohoWorkDrive.ensureSubfolder(parentFolderId, occurrenceId);

    // Update CRM record with WorkDrive folder ID
    if (workdriveFolderId) {
      try {
        await ZohoCRM.updateRecord("Occurrence_Management", recordId, {
          Occurrence_Workdrive_Folder_ID: workdriveFolderId
        });
      } catch (updateError: any) {
        console.error('Failed to update CRM with WorkDrive folder ID:', updateError.message);
        // Don't fail the whole process if this update fails
      }
    }

    // Upload user attachments if any exist
    if (userAttachments.length > 0) {
      attachmentResults = await ZohoWorkDrive.uploadFilesToFolder(userAttachments, workdriveFolderId, true);
    }
    
  } catch (workdriveError: any) {
    return {
      occurrenceId,
      workdriveFolder: null,
      attachments: [],
      attachmentCount: 0,
      warning: `WorkDrive upload failed: ${workdriveError.message}`
    };
  }

  return {
    occurrenceId,
    workdriveFolder: workdriveFolderId,
    attachments: attachmentResults,
    attachmentCount: attachmentResults.filter(r => r.status === 'uploaded_successfully').length
  };
}

/**
 * Prepare CRM data based on form type
 */
async function prepareCRMData(formType: string, data: FormData): Promise<Record<string, any>> {
  const timestamp = new Date().toISOString();
  
  // Base record structure
  const baseRecord = {
    // Name: `${formType} Report`, // Remove this as it might conflict with Name1
    Form_Type: formType,
    Form_ID: getFormId(formType),
  };

  // Add form-specific fields and flags
  switch (formType.toLowerCase()) {
    case 'accident':
    case 'accident report':
      const accidentData = data as AccidentFormData;
      
      // Ensure required fields are present and valid
      const firstName = accidentData.Name1 || accidentData.firstName || '';
      const lastName = accidentData.Last_Name || accidentData.lastName || '';
      const contactPhone = accidentData.Contact_Phone || accidentData.contactPhone || '';
      const reporterEmail = accidentData.Reporter_Email || accidentData.emailAddress || '';
      
      // Validate required fields
      if (!firstName.trim()) {
        throw new Error('Reporter first name is required');
      }
      if (!lastName.trim()) {
        throw new Error('Reporter last name is required');
      }
      if (!contactPhone.trim()) {
        throw new Error('Reporter contact phone is required');
      }
      if (!reporterEmail.trim()) {
        throw new Error('Reporter email is required');
      }
      
      return cleanupCRMRecord({
        ...baseRecord,
        // Reporter / Person submitting
        Name: lastName.trim(), // Standard CRM Name field (mandatory)
        Name1: firstName.trim(),
        Role: sanitizePick(accidentData.role || 'Other'),
        Member_Number: accidentData.Member_Number || accidentData.memberNumber || null,
        Reporter: `${firstName} ${lastName}`.trim(),
        Reporter_Email: reporterEmail.trim(),
        Contact_Phone: contactPhone.trim(),
        Last_Name: lastName.trim(),

        // PIC (Pilot in Command)
        PIC_Name: accidentData.PIC_Name || '',
        PIC_Contact_Phone: accidentData.PIC_Contact_Phone || accidentData.pilotContactPhone || '',
        PIC_Email: accidentData.PIC_Email || '',
        Date_of_Birth: formatDateOnly(accidentData.Date_of_Birth),
        Date_5: formatDateOnlyForCRM(accidentData.Date_5 || accidentData.Date_of_Birth),
        PIC_Member_Number: accidentData.PIC_Member_Number || '',
        PIC_Last_Name: accidentData.PIC_Last_Name || '',

        // Experience (convert to text format as expected by CRM)
        Hours_last_90_days: convertToText(accidentData.Hours_last_90_days),
        Hours_on_type: convertToText(accidentData.Hours_on_type),
        Hours_on_type_last_90_days: convertToText(accidentData.Hours_on_type_last_90_days),
        Total_flying_hours: convertToText(accidentData.Total_flying_hours),
  Registration_status: sanitizePick(accidentData.Registration_status),

        // Occurrence details
        Occurrence_Date1: accidentData.occurrenceDate || formatDateForCRM(accidentData.Occurrence_Date1),
        Occurrence_Date2: accidentData.Occurrence_Date2 ? formatDateOnlyForCRM(accidentData.Occurrence_Date2) : (accidentData.occurrenceDate ? formatDateOnlyForCRM(accidentData.occurrenceDate) : (accidentData.Occurrence_Date1 ? formatDateOnlyForCRM(accidentData.Occurrence_Date1) : null)),
        Description_of_Occurrence: accidentData.Details_of_incident_accident || '',
        Details_of_incident_accident: accidentData.Details_of_incident_accident || '',
        Location: accidentData.location || accidentData.Location || '',
        Location_of_hazard: accidentData.location || accidentData.Location || '',
        State: accidentData.State || accidentData.state || '',
        ...(accidentData.Latitude && accidentData.Latitude.trim() !== '' && { Latitude: accidentData.Latitude.trim() }),
        ...(accidentData.Longitude && accidentData.Longitude.trim() !== '' && { Longitude: accidentData.Longitude.trim() }),
  Occurrence_Type: sanitizePick(accidentData.Occurrence_Type),
  Is_this_occurrence_an_Accident_or_an_Incident: sanitizePick(accidentData.Is_this_occurrence_an_Accident_or_an_Incident || accidentData.Accident_or_Incident || 'Incident'),
        Description_of_damage_to_aircraft: accidentData.Description_of_damage_to_aircraft || '',
  Accident_or_Incident: sanitizePick(accidentData.Accident_or_Incident || accidentData.Is_this_occurrence_an_Accident_or_an_Incident),
        Reporter_Suggestions: accidentData.Reporter_Suggestions || '',
    Lookup_5: accidentData.Lookup_5 || undefined, // Flight Training School lookup - ID
    Y_Code: accidentData.Y_Code || undefined, // Aerodrome lookup - ID
  Level_2_Maintainer_L2: accidentData.Level_2_Maintainer_L2 || accidentData.Details_of_incident_accident || '',
  In_vicinity_of_aerodrome: convertToBoolean(accidentData.In_vicinity_of_aerodrome),
  Involve_IFR_or_Air_Transport_Operations: convertToBoolean(accidentData.Involve_IFR_or_Air_Transport_Operations),
  Involve_near_miss_with_another_aircraft: convertToBoolean(accidentData.Involve_near_miss_with_another_aircraft),
    In_controlled_or_special_use_airspace: convertToBoolean(accidentData.In_controlled_or_special_use_airspace),
  Bird_or_Animal_Strike: convertToBoolean(accidentData.Bird_or_Animal_Strike),

        // Aircraft details
        Registration_number: accidentData.Registration_number && accidentData.Serial_number1 ? 
          `${accidentData.Registration_number}-${accidentData.Serial_number1}` : 
          (accidentData.Registration_number || null),
        Model: accidentData.Model || '',
        Serial_number: accidentData.Serial_number || '',
        Make1: accidentData.Make1 || '',
        Type1: sanitizePick(accidentData.Type1) || '',
        Year_Built1: accidentData.Year_Built1 || '',
        Total_airframe_hours: convertToText(accidentData.Total_airframe_hours),
        Total_engine_hours: convertToText(accidentData.Total_engine_hours),
        Total_hours_since_service: convertToText(accidentData.Total_hours_since_service),
        Engine_Details: accidentData.Engine_Details || '',
        Engine_model: accidentData.Engine_model || '',
        Engine_serial: accidentData.Engine_serial || '',
        Propeller_make: accidentData.Propeller_make || '',
        Propeller_model: accidentData.Propeller_model || '',
        Propeller_serial: accidentData.Propeller_serial || '',

        // Operations / Environment
  Type_of_operation: sanitizePick(accidentData.Type_of_operation),
  Phase_of_flight: mapUnknown(accidentData.Phase_of_flight),
  Effect_of_flight: accidentData.Effect_of_flight ? [sanitizePick(accidentData.Effect_of_flight)].filter(Boolean) : undefined,
  Flight_Conditions: sanitizePick(accidentData.Flight_Conditions),
  Flight_Rules: mapUnknown(accidentData.Flight_Rules),
  Airspace_class: mapUnknown(accidentData.Airspace_class),
  Airspace_type: mapUnknown(accidentData.Airspace_type),
        Altitude: convertToNumber(accidentData.Altitude),
  Altitude_type: mapUnknown(accidentData.Altitude_type),
  Light_conditions: mapUnknown(accidentData.Light_conditions),
        Visibility: convertToNumber(accidentData.Visibility),
        Temperature: convertToNumber(accidentData.Temperature),
  Visibility_reduced_by: accidentData.Visibility_reduced_by ? [sanitizePick(accidentData.Visibility_reduced_by)].filter(Boolean) : undefined,
        Wind_direction: accidentData.Wind_direction || '',
        Wind_speed: convertToNumber(accidentData.Wind_speed),
  Wind_gusting: sanitizePick(accidentData.Wind_gusting),

        // Injury / Damage
        Passenger_details: accidentData.Passenger_details || '',
        Passenger_injury: accidentData.Passenger_injury || '',
        Persons_on_the_ground_injury: accidentData.Persons_on_the_ground_injury || '',
        Most_serious_injury_to_pilot: accidentData.Most_serious_injury_to_pilot || '',
        Damage_to_aircraft: accidentData.Damage_to_aircraft || '',

        // Flight movement
        Departure_location: accidentData.Departure_location || '',
        Destination_location: accidentData.Destination_location || '',
        Landing: accidentData.Landing || '',

        // Narratives / Classifications
        Provide_description_of_defect: accidentData.Provide_description_of_defect || '',
        Summary_of_actions_taken_to_be_provided: accidentData.Summary_of_actions_taken_to_be_provided || '',
        Classification_level: accidentData.Classification_level || '',
        ATSB_reportable_status: accidentData.ATSB_reportable_status || '',

        // Personal Locator Beacon
        PLB_Activated: convertToBoolean(accidentData.PLB_Activated),
        Personal_Locator_Beacon_carried: convertToYesNoText(accidentData.Personal_Locator_Beacon_carried),

        // Maintainer info
        Maintainer_Name: accidentData.Maintainer_Name || '',
        Maintainer_Last_Name: accidentData.Maintainer_Last_Name || '',
        Maintainer_Level: accidentData.Maintainer_Level || '',
        Maintainer_Member_Number: accidentData.Maintainer_Member_Number || '',

        // Wildlife strike details
        Type_of_strike: accidentData.Type_of_strike || '',
        Number_approx: accidentData.Number_approx || '',
        Species: accidentData.Species || '',
        Size: accidentData.Size || '',
        Number_struck_approx: accidentData.Number_struck_approx || '',

        // Near-aircraft collision details
        Second_aircraft_registration: accidentData.Second_aircraft_registration || '',
        Second_Aircraft_Manufacturer: accidentData.Second_Aircraft_Manufacturer || '',
        Second_Aircraft_Model: accidentData.Second_Aircraft_Model || '',
        Horizontal_Proximity: convertToNumber(accidentData.Horizontal_Proximity),
        Horizontal_Proximity_Unit: accidentData.Horizontal_Proximity_Unit || '',
        Vertical_Proximity: convertToNumber(accidentData.Vertical_Proximity),
        Vertical_Proximity_Unit: accidentData.Vertical_Proximity_Unit || '',
        Relative_Track: accidentData.Relative_Track || '',
        Avoidance_manoeuvre_needed: accidentData.Avoidance_manoeuvre_needed || '',
        Alert_Received: accidentData.Alert_Received || '',

        // Add accident-specific flag
        Accident: true,
      });

    case 'defect':
    case 'defect report':
      const defectData = data as DefectFormData;
      return cleanupCRMRecord({
        ...baseRecord,
        // Person Reporting
        Name: defectData.Last_Name || defectData.lastName || '', // Standard CRM Name field (mandatory)
        Role: sanitizePick(defectData.role || ''),
        Name1: defectData.Name1 || defectData.firstName || '',
        Member_Number: defectData.Member_Number || defectData.memberNumber || '',
        Reporter_First_Name: defectData.Reporter_First_Name || defectData.Name1 || defectData.firstName || '',
        Reporter_Email: defectData.Reporter_Email || defectData.email || '',
        Contact_Phone: defectData.Contact_Phone || defectData.contactPhone || '',
        Last_Name: defectData.Last_Name || defectData.lastName || '',
        Postcode: defectData.Postcode || '',

        // Defect Information
        Occurrence_Date1: (defectData.Occurrence_Date1 || defectData.dateDefectIdentified) ? 
          formatDateForCRM(defectData.Occurrence_Date1 || defectData.dateDefectIdentified!) : '',
        Occurrence_Date2: defectData.Occurrence_Date2 ? formatDateOnlyForCRM(defectData.Occurrence_Date2) : ((defectData.Occurrence_Date1 || defectData.dateDefectIdentified) ? formatDateOnlyForCRM(defectData.Occurrence_Date1 || defectData.dateDefectIdentified!) : null),
        Reporter_Suggestions: defectData.Reporter_Suggestions || defectData.preventionSuggestions || '',
        Location_of_aircraft_when_defect_was_found: defectData.Location_of_aircraft_when_defect_was_found || defectData.locationOfAircraft || '',
        Location: defectData.Location || defectData.locationOfAircraft || '',
        State: defectData.State || defectData.state || '',
        ...(defectData.Latitude && defectData.Latitude.trim() !== '' && { Latitude: defectData.Latitude.trim() }),
        ...(defectData.Longitude && defectData.Longitude.trim() !== '' && { Longitude: defectData.Longitude.trim() }),
        Storage_conditions: defectData.Storage_conditions || '',
        Description_of_Occurrence: defectData.Description_of_Occurrence || defectData.defectDescription || '',
        Defective_component: defectData.Defective_component || defectData.defectiveComponent || '',
        Provide_description_of_defect: defectData.Provide_description_of_defect || defectData.defectDescription || '',

        // Damage Information
        Damage_to_aircraft: defectData.Damage_to_aircraft || '',
        Part_of_aircraft_damaged: defectData.Part_of_aircraft_damaged || '',
        Description_of_damage_to_aircraft: defectData.Description_of_damage_to_aircraft || '',

        // Maintainer Information
        Maintainer_Name: defectData.Maintainer_Name || defectData.maintainerName || '',
        Maintainer_Last_Name: defectData.Maintainer_Last_Name || defectData.maintainerLastName || '',
        Maintainer_Member_Number: defectData.Maintainer_Member_Number || defectData.maintainerMemberNumber || '',
        Maintainer_Level: defectData.Maintainer_Level || defectData.maintainerLevel || '',
        Do_you_have_further_suggestions_on_how_to_PSO: defectData.Do_you_have_further_suggestions_on_how_to_PSO || defectData.preventionSuggestions || '',

        // Aircraft Information
        Registration_number: defectData.Registration_number || 
          (defectData.registrationNumberPrefix && defectData.registrationNumberSuffix ? 
            `${defectData.registrationNumberPrefix}-${defectData.registrationNumberSuffix}` : ''),
  Registration_status: sanitizePick(defectData.Registration_status || defectData.registrationStatus || ''),
        Serial_number: defectData.Serial_number || defectData.serialNumber || '',
        Make1: defectData.Make || defectData.Make1 || defectData.make || '',
        Model: defectData.Model || defectData.model || '',
  Type1: sanitizePick(defectData.Type1 || defectData.type || ''),
        Year_Built1: defectData.Year_Built1 || defectData.yearBuilt || '',

        // Engine Details
        Engine_Details: defectData.Engine_Details || '',
        Engine_model: defectData.Engine_model || defectData.engineModel || '',
        Engine_serial: defectData.Engine_serial || defectData.engineSerial || '',
        Total_engine_hours: convertToText(defectData.Total_engine_hours || defectData.totalEngineHours),
        Total_hours_since_service: convertToText(defectData.Total_hours_since_service || defectData.totalHoursSinceService),

        // Propeller Details
        Propeller_make: defectData.Propeller_make || defectData.propellerMake || '',
        Propeller_model: defectData.Propeller_model || defectData.propellerModel || '',
        Propeller_serial: defectData.Propeller_serial || defectData.propellerSerial || '',

        // Training Usage
  Is_the_aircraft_used_for_training_purposes: convertToYesNoText(defectData.Is_the_aircraft_used_for_training_purposes),

        // Add defect-specific flag
        Defect: true,
  });

    case 'complaint':
    case 'complaint report':
      const complaintData = data as ComplaintFormData;
      return cleanupCRMRecord({
        ...baseRecord,
        Name: complaintData.Last_Name || '', // Standard CRM Name field (mandatory)
        Role: sanitizePick(complaintData.Role || ''),
        Member_Number: complaintData.Member_Number || '',
        Name1: complaintData.Name1 || '',
        Last_Name: complaintData.Last_Name || '',
        Contact_Phone: complaintData.Contact_Phone || '',
        Reporter_Email: complaintData.Reporter_Email || '',
        Occurrence_Date1: complaintData.Occurrence_Date1 ? formatDateForCRM(complaintData.Occurrence_Date1) : '',
        Occurrence_Date2: complaintData.Occurrence_Date2 ? formatDateOnlyForCRM(complaintData.Occurrence_Date2) : (complaintData.Occurrence_Date1 ? formatDateOnlyForCRM(complaintData.Occurrence_Date1) : null),
        Description_of_Occurrence: complaintData.Description_of_Occurrence || '',
        // Add complaint-specific flag
        Complaint: true,
      });

    case 'hazard':
    case 'hazard report':
      const hazardData = data as HazardFormData;
      return cleanupCRMRecord({
        ...baseRecord,
        Name: hazardData.Last_Name || '', // Standard CRM Name field (mandatory)
        Role: sanitizePick(hazardData.role || ''),
        Member_Number: hazardData.Member_Number || '',
        Reporter_First_Name: hazardData.Name1 || '', // Map Name1 to Reporter_First_Name
        Contact_Phone: hazardData.Contact_Phone || '',
        Reporter_Email: hazardData.Reporter_Email || '',
        Last_Name: hazardData.Last_Name || '',
        Name1: hazardData.Name1 || '',
        Date_Hazard_Identified: hazardData.Date_Hazard_Identified ? formatDateForCRM(hazardData.Date_Hazard_Identified) : '',
        Reporter_Suggestions: hazardData.Reporter_Suggestions || '',
        Location_of_hazard: hazardData.Location_of_Hazard || hazardData.Location_of_hazard || '',
        Location: hazardData.Location_of_Hazard || hazardData.Location_of_hazard || '',
        State: hazardData.State || '',
        Description_of_Occurrence: hazardData.Hazard_Description || hazardData.Please_fully_describe_the_identified_hazard || '',
        Please_fully_describe_the_identified_hazard: hazardData.Hazard_Description || hazardData.Please_fully_describe_the_identified_hazard || '',
        Potential_Consequences_of_Hazard: hazardData.Potential_Consequences_of_Hazard || '',
        Do_you_have_further_suggestions_on_how_to_PSO: hazardData.Do_you_have_further_suggestions_on_how_to_PSO || '',
        Hazard_relates_to_specific_aerodrome: convertToBoolean(hazardData.Hazard_Relates_To_Specific_Aerodrome),
        Y_Code: hazardData.Y_Code || undefined, // Aerodrome lookup - ID
        ...((hazardData.Latitude || hazardData.Location_Latitude) ? { Latitude: (hazardData.Latitude || hazardData.Location_Latitude!).trim() } : {}),
        ...((hazardData.Longitude || hazardData.Location_Longitude) ? { Longitude: (hazardData.Longitude || hazardData.Location_Longitude!).trim() } : {}),
        // Add hazard-specific flag
        Hazard: true,
      });

    default:
      throw new Error(`Unsupported form type: ${formType}`);
  }
}

/**
 * Get form ID based on form type
 */
function getFormId(formType: string): string {
  switch (formType.toLowerCase()) {
    case 'accident':
    case 'accident report':
      return '1';
    case 'defect':
    case 'defect report':
      return '2';
    case 'complaint':
    case 'complaint report':
      return '123';
    case 'hazard':
    case 'hazard report':
      return '4';
    default:
      return 'unknown';
  }
}

/**
 * Format date for CRM (ISO format)
 */
function formatDateForCRM(dateString: string | undefined | null): string {
  if (!dateString) {
    throw new Error('Occurrence date is required');
  }
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      throw new Error('Invalid date format provided');
    }
    
    // Return in ISO format (YYYY-MM-DDTHH:mm:ss)
    return date.toISOString().slice(0, 19);
  } catch (error) {
    throw new Error('Invalid date format provided');
  }
}

/**
 * Format date-only field for CRM as datetime (YYYY-MM-DDTHH:mm:ss format)
 * Zoho CRM expects datetime format even for birth dates
 */
function formatDateOnly(dateString: string | undefined | null): string | null {
  if (!dateString) {
    return null;
  }
  
  try {
    // Convert date-only to datetime by adding midnight time
    const date = new Date(dateString + 'T00:00:00');
    if (isNaN(date.getTime())) {
      return null;
    }
    
    // Return in datetime format (YYYY-MM-DDTHH:mm:ss) as expected by Zoho CRM
    return date.toISOString().slice(0, 19);
  } catch (error) {
    return null;
  }
}

/**
 * Format date-only field for CRM as date (YYYY-MM-DD format)
 * Zoho CRM expects Date fields as YYYY-MM-DD
 */
function formatDateOnlyForCRM(dateString: string | undefined | null): string | null {
  if (!dateString) {
    return null;
  }
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return null;
    }
    
    // Return in date format (YYYY-MM-DD) as expected by Zoho CRM Date fields
    return date.toISOString().split('T')[0];
  } catch (error) {
    return null;
  }
}

/**
 * Convert Yes/No string or boolean to boolean for CRM Boolean fields
 * Zoho CRM expects Boolean fields as true/false, not strings
 */
function convertToBoolean(value: string | boolean | undefined): boolean {
  if (typeof value === 'boolean') return value;
  if (!value) return false;

  const stringValue = String(value).toLowerCase();
  return stringValue === 'yes' || stringValue === 'true';
}

/**
 * Convert string to number for CRM numeric fields
 * Zoho CRM expects numeric fields as numbers, not strings
 */
function convertToNumber(value: string | number | undefined | null): number | null {
  if (typeof value === 'number') return value;
  if (!value || value === '') return null;
  
  const numValue = parseFloat(String(value));
  return isNaN(numValue) ? null : numValue;
}

/**
 * Convert value to text string for CRM text fields
 * Some fields that appear numeric are actually text fields in Zoho CRM
 */
function convertToText(value: string | number | undefined | null): string | null {
  if (!value || value === '') return null;
  return String(value);
}

/**
 * Convert Yes/No string or boolean to text for CRM Pick List fields
 * Zoho CRM expects Pick List fields as text, not boolean
 */
function convertToYesNoText(value: string | boolean | undefined): string {
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (!value) return '';

  const stringValue = String(value).toLowerCase();
  if (stringValue === 'yes' || stringValue === 'true') return 'Yes';
  if (stringValue === 'no' || stringValue === 'false') return 'No';
  return 'No'; // Default to 'No' for unknown values
}

/**
 * Sanitize picklist placeholders (map to undefined or 'Unknown' where appropriate)
 */
function sanitizePick(value: any): any {
  if (value === null || value === undefined) return undefined;
  const s = String(value).trim();
  if (!s) return undefined;
  const placeholders = new Set([
    '-None-',
    '– Please select –',
    '- Please Select -',
    '- Please select -',
    'Please select',
    'Not Answered',
    'Not answered',
  ]);
  if (placeholders.has(s)) return undefined;
  return s;
}

/**
 * For fields that support 'Unknown', map 'Not Answered' → 'Unknown'
 */
function mapUnknown(value: any): any {
  if (value === null || value === undefined) return undefined;
  const s = String(value).trim();
  if (!s) return undefined;
  if (s === 'Not Answered' || s === 'Not answered') return 'Unknown';
  return sanitizePick(s);
}

/**
 * Remove empty strings and placeholder values from the final CRM payload
 */
function cleanupCRMRecord(record: Record<string, any>): Record<string, any> {
  const cleaned: Record<string, any> = {};
  const placeholderSet = new Set([
    '',
    '-None-',
    '– Please select –',
    '- Please Select -',
    '- Please select -',
    'Please select',
    'Not Answered',
    'Not answered',
  ]);
  
  for (const [k, v] of Object.entries(record)) {
    if (v === null || v === undefined) continue;
    
    if (typeof v === 'string') {
      const trimmed = v.trim();
      if (placeholderSet.has(trimmed) || trimmed === '') continue;
      
      // Truncate very long strings to prevent field length issues
      const maxLength = 255; // Common CRM field limit
      const finalValue = trimmed.length > maxLength ? trimmed.substring(0, maxLength) : trimmed;
      
      cleaned[k] = finalValue;
      continue;
    }
    
    if (Array.isArray(v)) {
      const arr = v.filter((x) => x !== null && x !== undefined && !(typeof x === 'string' && placeholderSet.has(x.trim())));
      if (arr.length === 0) continue;
      cleaned[k] = arr;
      continue;
    }
    
    // For numbers, ensure they're valid
    if (typeof v === 'number' && !isNaN(v)) {
      cleaned[k] = v;
      continue;
    }
    
    // For booleans
    if (typeof v === 'boolean') {
      cleaned[k] = v;
      continue;
    }
    
    // For other types, include as-is
    cleaned[k] = v;
  }
  
  return cleaned;
}

/**
 * Validate CRM data before sending to Zoho
 */
function validateCRMData(crmData: Record<string, any>): void {
  // Check for problematic field types
  const problematicFields: string[] = [];
  
  for (const [key, value] of Object.entries(crmData)) {
    // Check for empty strings that should be null
    if (value === '') {
      console.warn(`Field '${key}' has empty string value`);
    }
    
    // Check for NaN numbers
    if (typeof value === 'number' && isNaN(value)) {
      problematicFields.push(`${key}: NaN number`);
    }
    
    // Check for very long strings that might exceed field limits
    if (typeof value === 'string' && value.length > 1000) {
      console.warn(`Field '${key}' has very long string (${value.length} chars)`);
    }
    
    // Check for arrays with invalid content
    if (Array.isArray(value)) {
      const hasInvalidItems = value.some(item => item === '' || item === null || item === undefined);
      if (hasInvalidItems) {
        console.warn(`Field '${key}' has array with invalid items`);
      }
    }
  }
  
  if (problematicFields.length > 0) {
    console.error("Problematic fields found:", problematicFields);
  }
}

/**
 * Validate form data based on form type
 */
function validateFormData(formType: string, data: any): { isValid: boolean; errors?: string[] } {
  const errors: string[] = [];
  
  // Form-specific validation with proper field names
  switch (formType.toLowerCase()) {
    case 'accident':
    case 'accident report':
      // Check required fields for accident reports
      if (!data.Name1 && !data.firstName) {
        errors.push("Reporter first name is required");
      }
      if (!data.Last_Name && !data.lastName) {
        errors.push("Reporter last name is required");
      }
      if (!data.Contact_Phone && !data.contactPhone) {
        errors.push("Reporter contact phone is required");
      }
      if (!data.Reporter_Email && !data.emailAddress) {
        errors.push("Reporter email is required");
      }
      if (!data.Occurrence_Date1 && !data.occurrenceDate) {
        errors.push("Occurrence date is required for accident reports");
      }
      if (!data.Details_of_incident_accident && !data.detailsOfIncident) {
        errors.push("Details of incident are required for accident reports");
      }
      break;

    case 'defect':
    case 'defect report':
      // Check common fields for defect (using CRM field names with backward compatibility)
      if (!data.Name1 && !data.firstName) {
        errors.push("First name is required");
      }
      if (!data.Last_Name && !data.lastName) {
        errors.push("Last name is required");
      }
      // Contact phone is optional for defect reports
      // if (!data.Contact_Phone && !data.contactPhone) {
      //   errors.push("Contact phone is required");
      // }
      if (!data.Occurrence_Date1 && !data.dateDefectIdentified) {
        errors.push("Date defect identified is required for defect reports");
      }
      if (!data.Description_of_Occurrence && !data.defectDescription && !data.Provide_description_of_defect) {
        errors.push("Defect description is required for defect reports");
      }
      break;

    case 'complaint':
    case 'complaint report':
      // Check common fields for complaint (using CRM field names)
      if (!data.Name1) {
        errors.push("First name is required");
      }
      if (!data.Last_Name) {
        errors.push("Last name is required");
      }
      // Contact phone is optional for complaints, especially if anonymous
      // if (!data.Contact_Phone) {
      //   errors.push("Contact phone is required");
      // }
      if (!data.Occurrence_Date1) {
        errors.push("Occurrence date is required for complaint reports");
      }
      if (!data.Description_of_Occurrence) {
        errors.push("Description of occurrence is required for complaint reports");
      }
      break;

    case 'hazard':
    case 'hazard report':
      // Check common fields for hazard (using CRM field names)
      if (!data.Name1) {
        errors.push("First name is required");
      }
      if (!data.Last_Name) {
        errors.push("Last name is required");
      }
      // Contact phone is optional for hazard reports
      // if (!data.Contact_Phone) {
      //   errors.push("Contact phone is required");
      // }
      if (!data.Date_Hazard_Identified && !data.Occurrence_Date1) {
        errors.push("Date hazard identified is required for hazard reports");
      }
      if (!data.Hazard_Description && !data.Please_fully_describe_the_identified_hazard && !data.Description_of_Occurrence) {
        errors.push("Hazard description is required for hazard reports");
      }
      if (!data.Location_of_Hazard && !data.Location_of_hazard && !data.Location) {
        errors.push("Hazard location is required for hazard reports");
      }
      break;

    default:
      errors.push(`Unsupported form type: ${formType}`);
  }

  return {
    isValid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined
  };
}