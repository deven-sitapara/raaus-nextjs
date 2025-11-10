import { PDFGenerator, formatDate, formatDateOnly } from './pdfGenerator';
import { AccidentFormData } from '@/types/forms';
import aerodromeData from '@/components/forms/aerodrome-codes.json';
import accountsData from '@/components/forms/accounts-codes.json';

export class AccidentPDFGenerator extends PDFGenerator {
  constructor() {
    super('STANDARD'); // Use standard layout for multi-page accident reports
  }

  private getAerodromeName(id: string | undefined): string | undefined {
    if (!id) return undefined;
    const aerodrome = aerodromeData.aerodromes.find(a => a.id === id);
    return aerodrome?.Name;
  }

  private getAccountName(id: string | undefined): string | undefined {
    if (!id) return undefined;
    const account = accountsData.accounts.find(a => a.id === id);
    return account?.Account_Name;
  }

  // Helper to check if value has actual data (not null, undefined, empty string, or N/A)
  private hasValue(value: any): boolean {
    if (value === null || value === undefined || value === '' || value === 'N/A') {
      return false;
    }
    if (Array.isArray(value) && value.length === 0) {
      return false;
    }
    return true;
  }

  async generate(data: AccidentFormData, metadata?: any): Promise<Buffer> {
    // Add header with submission date
    const reportType = data.Accident_or_Incident || data.Is_this_occurrence_an_Accident_or_an_Incident || 'Accident/Incident';
    const submissionDate = metadata?.timestamp ? formatDate(metadata.timestamp) : undefined;
    this.addHeader(`${reportType} Report`, submissionDate);

    // ========== REPORTER INFORMATION ==========
    // Only show section if there's at least some reporter data
    if (this.hasValue(data.role) || this.hasValue(data.Member_Number || data.memberNumber) ||
        this.hasValue(data.Name1 || data.firstName) || this.hasValue(data.Last_Name || data.lastName) ||
        this.hasValue(data.Reporter_Email || data.emailAddress) || this.hasValue(data.Contact_Phone || data.contactPhone)) {
      this.addSection('Person Reporting');

      if (this.hasValue(data.role) || this.hasValue(data.Member_Number || data.memberNumber)) {
        const roleDisplay = data.role === 'Other' && data.customRole ? `Other - ${data.customRole}` : data.role;
        this.addFieldPair('Role', roleDisplay, 'Member Number', data.Member_Number || data.memberNumber);
      }
      if (this.hasValue(data.Reporter)) {
        this.addField('Reporter Name', data.Reporter);
      }
      if (this.hasValue(data.Name1 || data.firstName) || this.hasValue(data.Last_Name || data.lastName)) {
        this.addFieldPair('First Name', data.Name1 || data.firstName, 'Last Name', data.Last_Name || data.lastName);
      }
      if (this.hasValue(data.Reporter_Email || data.emailAddress) || this.hasValue(data.Contact_Phone || data.contactPhone)) {
        this.addFieldPair('Email', data.Reporter_Email || data.emailAddress, 'Contact Phone', data.Contact_Phone || data.contactPhone);
      }
    }

    // ========== PILOT IN COMMAND ==========
    if (data.role !== 'Pilot in Command' && (this.hasValue(data.PIC_Name) || this.hasValue(data.PIC_Last_Name) ||
        this.hasValue(data.PIC_Member_Number) || this.hasValue(data.Date_of_Birth) ||
        this.hasValue(data.PIC_Email) || this.hasValue(data.PIC_Contact_Phone || data.pilotContactPhone))) {
      this.addSection('Pilot in Command');

      if (this.hasValue(data.PIC_Name) || this.hasValue(data.PIC_Last_Name)) {
        this.addFieldPair('First Name', data.PIC_Name, 'Last Name', data.PIC_Last_Name);
      }
      if (this.hasValue(data.PIC_Member_Number) || this.hasValue(data.Date_of_Birth)) {
        this.addFieldPair('Member Number', data.PIC_Member_Number, 'Date of Birth', formatDateOnly(data.Date_of_Birth));
      }
      if (this.hasValue(data.PIC_Email) || this.hasValue(data.PIC_Contact_Phone || data.pilotContactPhone)) {
        this.addFieldPair('Email', data.PIC_Email, 'Contact Phone', data.PIC_Contact_Phone || data.pilotContactPhone);
      }
      if (this.hasValue(data.Date_5)) {
        this.addField('Additional Date', formatDate(data.Date_5));
      }
    }

    // ========== FLYING EXPERIENCE ==========
    if (this.hasValue(data.Total_flying_hours) || this.hasValue(data.Hours_last_90_days) ||
        this.hasValue(data.Hours_on_type) || this.hasValue(data.Hours_on_type_last_90_days)) {
      this.addSection('Flying Hours');

      if (this.hasValue(data.Total_flying_hours) || this.hasValue(data.Hours_last_90_days)) {
        this.addFieldPair('Total Flying Hours', data.Total_flying_hours, 'Hours Last 90 Days', data.Hours_last_90_days);
      }
      if (this.hasValue(data.Hours_on_type) || this.hasValue(data.Hours_on_type_last_90_days)) {
        this.addFieldPair('Hours on Type', data.Hours_on_type, 'Hours on Type (90 Days)', data.Hours_on_type_last_90_days);
      }
    }

    // ========== OCCURRENCE DETAILS ==========
    if (this.hasValue(data.Occurrence_Date1 || data.occurrenceDate) || this.hasValue(data.State || data.state) ||
        this.hasValue(data.Location || data.location) || this.hasValue(data.Details_of_incident_accident) ||
        this.hasValue(data.Latitude) || this.hasValue(data.Longitude) || this.hasValue(data.Occurrence_Type) ||
        this.hasValue(data.Occurrence_Date2) || this.hasValue(data.Level_2_Maintainer_L2)) {
      this.addSection('Occurrence Information');

      if (this.hasValue(data.Occurrence_Date1 || data.occurrenceDate)) {
        this.addField('Date & Time', formatDate(data.Occurrence_Date1 || data.occurrenceDate));
      }
      if (this.hasValue(data.Occurrence_Date2)) {
        this.addField('Secondary Date & Time', formatDate(data.Occurrence_Date2));
      }
      if (this.hasValue(data.Occurrence_Type)) {
        this.addField('Occurrence Type', data.Occurrence_Type);
      }
      if (this.hasValue(data.State || data.state) || this.hasValue(data.Location || data.location)) {
        this.addFieldPair('State', data.State || data.state, 'Location', data.Location || data.location);
      }
      if (this.hasValue(data.Latitude) && this.hasValue(data.Longitude)) {
        this.addField('GPS Coordinates', `Latitude: ${data.Latitude}, Longitude: ${data.Longitude}`);
      }
      if (this.hasValue(data.Level_2_Maintainer_L2)) {
        this.addField('Level 2 Maintainer', data.Level_2_Maintainer_L2);
      }
      if (this.hasValue(data.Details_of_incident_accident)) {
        this.addField('Incident/Accident Details', data.Details_of_incident_accident, true);
      }
    }

    // ========== DAMAGE AND INJURY ASSESSMENT ==========
    if (this.hasValue(data.Damage_to_aircraft) || this.hasValue(data.Most_serious_injury_to_pilot) ||
        this.hasValue(data.Description_of_damage_to_aircraft) || this.hasValue(data.Passenger_injury) ||
        this.hasValue(data.Persons_on_the_ground_injury) || this.hasValue(data.Passenger_details)) {
      this.addSection('Damage and Injury Assessment');

      if (this.hasValue(data.Damage_to_aircraft) || this.hasValue(data.Most_serious_injury_to_pilot)) {
        this.addFieldPair('Damage to Aircraft', data.Damage_to_aircraft, 'Most Serious Injury to Pilot', data.Most_serious_injury_to_pilot);
      }
      if (this.hasValue(data.Description_of_damage_to_aircraft)) {
        this.addField('Damage Description', data.Description_of_damage_to_aircraft, true);
      }
      if (this.hasValue(data.Passenger_injury) || this.hasValue(data.Persons_on_the_ground_injury)) {
        this.addFieldPair('Passenger Injury', data.Passenger_injury, 'Persons on Ground Injury', data.Persons_on_the_ground_injury);
      }
      if (this.hasValue(data.Passenger_details)) {
        this.addField('Passenger Details', data.Passenger_details, true);
      }
    }

    // ========== CLASSIFICATION ==========
    if (this.hasValue(reportType) || this.hasValue(data.ATSB_reportable_status) || this.hasValue(data.Reporter_Suggestions) ||
        this.hasValue(data.Classification_level) || this.hasValue(data.Provide_description_of_defect) ||
        this.hasValue(data.Summary_of_actions_taken_to_be_provided)) {
      this.addSection('Occurrence Classification');

      if (this.hasValue(reportType) || this.hasValue(data.ATSB_reportable_status)) {
        this.addFieldPair('Type', reportType, 'ATSB Status', data.ATSB_reportable_status);
      }
      if (this.hasValue(data.Classification_level)) {
        this.addField('Classification Level', data.Classification_level);
      }
      if (this.hasValue(data.Provide_description_of_defect)) {
        this.addField('Defect Description', data.Provide_description_of_defect, true);
      }
      if (this.hasValue(data.Summary_of_actions_taken_to_be_provided)) {
        this.addField('Actions Taken', data.Summary_of_actions_taken_to_be_provided, true);
      }
      if (this.hasValue(data.Reporter_Suggestions)) {
        this.addField('Prevention Suggestions', data.Reporter_Suggestions, true);
      }
    }

    // ========== FLIGHT DETAILS ==========
    if (this.hasValue(data.Departure_location) || this.hasValue(data.Destination_location) ||
        this.hasValue(data.Landing) || this.hasValue(data.Type_of_operation) || this.hasValue(data.Phase_of_flight) ||
        this.hasValue(data.Lookup_5) || this.hasValue(data.Effect_of_flight) || this.hasValue(data.Flight_Rules)) {
      this.addSection('Flight Details');

      if (this.hasValue(data.Departure_location) || this.hasValue(data.Destination_location)) {
        this.addFieldPair('Departure', data.Departure_location, 'Destination', data.Destination_location);
      }
      if (this.hasValue(data.Landing)) {
        this.addField('Landing Location', data.Landing);
      }
      if (this.hasValue(data.Type_of_operation) || this.hasValue(data.Phase_of_flight)) {
        this.addFieldPair('Type of Operation', data.Type_of_operation, 'Phase of Flight', data.Phase_of_flight);
      }
      if (this.hasValue(data.Lookup_5)) {
        const schoolName = this.getAccountName(data.Lookup_5);
        const schoolDisplay = data.customFlightSchool ? `Other - ${data.customFlightSchool}` : schoolName;
        this.addField('Flight Training School', schoolDisplay);
      }
      if (this.hasValue(data.Effect_of_flight) || this.hasValue(data.Flight_Rules)) {
        this.addFieldPair('Effect of Flight', data.Effect_of_flight, 'Flight Rules', data.Flight_Rules);
      }
    }

    // ========== AIRSPACE INFORMATION ==========
    if (this.hasValue(data.Airspace_class) || this.hasValue(data.Airspace_type) ||
        this.hasValue(data.Altitude) || this.hasValue(data.Altitude_type) ||
        this.hasValue(data.In_vicinity_of_aerodrome) || this.hasValue(data.Y_Code) ||
        this.hasValue(data.Involve_IFR_or_Air_Transport_Operations) || this.hasValue(data.In_controlled_or_special_use_airspace)) {
      this.addSection('Airspace Information');

      if (this.hasValue(data.Airspace_class) || this.hasValue(data.Airspace_type)) {
        this.addFieldPair('Airspace Class', data.Airspace_class, 'Airspace Type', data.Airspace_type);
      }
      if (this.hasValue(data.Altitude) || this.hasValue(data.Altitude_type)) {
        this.addFieldPair('Altitude', data.Altitude ? `${data.Altitude} ft` : undefined, 'Altitude Type', data.Altitude_type);
      }

      // Regulatory Flags
      if (this.hasValue(data.Involve_IFR_or_Air_Transport_Operations)) {
        this.addField('Involves IFR/Air Transport', data.Involve_IFR_or_Air_Transport_Operations === true || data.Involve_IFR_or_Air_Transport_Operations === 'Yes' ? 'Yes' : 'No');
      }
      if (this.hasValue(data.In_controlled_or_special_use_airspace)) {
        this.addField('In Controlled/Special Airspace', data.In_controlled_or_special_use_airspace === true || data.In_controlled_or_special_use_airspace === 'Yes' ? 'Yes' : 'No');
      }

      // Aerodrome Vicinity Information
      const inVicinityOfAerodrome = data.In_vicinity_of_aerodrome;
      if (this.hasValue(inVicinityOfAerodrome)) {
        this.addField('In Vicinity of Aerodrome', inVicinityOfAerodrome === true || inVicinityOfAerodrome === 'Yes' ? 'Yes' : 'No');

        if ((inVicinityOfAerodrome === true || inVicinityOfAerodrome === 'Yes') && this.hasValue(data.Y_Code)) {
          const aerodromeName = this.getAerodromeName(data.Y_Code);
          this.addField('Vicinity Aerodrome', aerodromeName || data.Y_Code);
        }
      }
    }

    // ========== ENVIRONMENTAL CONDITIONS ==========
    if (this.hasValue(data.Light_conditions) || this.hasValue(data.Wind_speed) || this.hasValue(data.Visibility) ||
        this.hasValue(data.Wind_direction) || this.hasValue(data.Wind_gusting) || this.hasValue(data.Temperature) ||
        this.hasValue(data.Visibility_reduced_by) || this.hasValue(data.Personal_Locator_Beacon_carried) ||
        this.hasValue(data.PLB_Activated)) {
      this.addSection('Environmental Conditions');

      if (this.hasValue(data.Light_conditions) || this.hasValue(data.Visibility)) {
        this.addFieldPair('Light Conditions', data.Light_conditions, 'Visibility', data.Visibility ? `${data.Visibility} NM` : undefined);
      }
      if (this.hasValue(data.Wind_speed) || this.hasValue(data.Wind_direction)) {
        this.addFieldPair('Wind Speed', data.Wind_speed ? `${data.Wind_speed} knots` : undefined, 'Wind Direction', data.Wind_direction);
      }
      if (this.hasValue(data.Wind_gusting) || this.hasValue(data.Temperature)) {
        this.addFieldPair('Wind Gusting', data.Wind_gusting, 'Temperature', data.Temperature ? `${data.Temperature}°C` : undefined);
      }
      if (this.hasValue(data.Visibility_reduced_by)) {
        this.addField('Visibility Reduced By', Array.isArray(data.Visibility_reduced_by) ? data.Visibility_reduced_by.join(', ') : data.Visibility_reduced_by);
      }
      if (this.hasValue(data.Personal_Locator_Beacon_carried) || this.hasValue(data.PLB_Activated)) {
        this.addFieldPair('PLB Carried', data.Personal_Locator_Beacon_carried, 'PLB Activated', data.PLB_Activated);
      }
    }

    // ========== BIRD/ANIMAL STRIKE ==========
    if (this.hasValue(data.Bird_or_Animal_Strike) && (this.hasValue(data.Type_of_strike) || this.hasValue(data.Size) ||
        this.hasValue(data.Species) || this.hasValue(data.Number_approx) || this.hasValue(data.Number_struck_approx))) {
      this.addSection('Bird/Animal Strike Information');

      if (this.hasValue(data.Type_of_strike) || this.hasValue(data.Size)) {
        this.addFieldPair('Type of Strike', data.Type_of_strike, 'Size', data.Size);
      }
      if (this.hasValue(data.Species)) {
        this.addField('Species', data.Species);
      }
      if (this.hasValue(data.Number_approx) || this.hasValue(data.Number_struck_approx)) {
        this.addFieldPair('Number (Approx)', data.Number_approx, 'Number Struck', data.Number_struck_approx);
      }
    }

    // ========== NEAR COLLISION ==========
    if (this.hasValue(data.Involve_near_miss_with_another_aircraft) && (this.hasValue(data.Second_aircraft_registration) ||
        this.hasValue(data.Second_Aircraft_Manufacturer) || this.hasValue(data.Second_Aircraft_Model) ||
        this.hasValue(data.Horizontal_Proximity) || this.hasValue(data.Vertical_Proximity) ||
        this.hasValue(data.Relative_Track) || this.hasValue(data.Avoidance_manoeuvre_needed) || this.hasValue(data.Alert_Received))) {
      this.addSection('Near Collision with Another Aircraft');

      if (this.hasValue(data.Second_aircraft_registration) || this.hasValue(data.Second_Aircraft_Manufacturer)) {
        this.addFieldPair('Second Aircraft Registration', data.Second_aircraft_registration, 'Manufacturer', data.Second_Aircraft_Manufacturer);
      }
      if (this.hasValue(data.Second_Aircraft_Model)) {
        this.addField('Model', data.Second_Aircraft_Model);
      }
      if (this.hasValue(data.Horizontal_Proximity) || this.hasValue(data.Vertical_Proximity)) {
        this.addFieldPair('Horizontal Proximity', data.Horizontal_Proximity ? `${data.Horizontal_Proximity} ${data.Horizontal_Proximity_Unit}` : undefined,
                         'Vertical Proximity', data.Vertical_Proximity ? `${data.Vertical_Proximity} ${data.Vertical_Proximity_Unit}` : undefined);
      }
      if (this.hasValue(data.Relative_Track) || this.hasValue(data.Avoidance_manoeuvre_needed)) {
        const relativeTrackDisplay = data.Relative_Track === 'Other' && data.customRelativeTrack ? `Other - ${data.customRelativeTrack}` : data.Relative_Track;
        this.addFieldPair('Relative Track', relativeTrackDisplay, 'Avoidance Manoeuvre', data.Avoidance_manoeuvre_needed);
      }
      if (this.hasValue(data.Alert_Received)) {
        const alertDisplay = data.Alert_Received === 'Other' && data.customAlertReceived ? `Other - ${data.customAlertReceived}` : data.Alert_Received;
        this.addField('Alert Received', alertDisplay);
      }
    }

    // ========== AIRCRAFT DETAILS ==========
    if (this.hasValue(data.Registration_number) || this.hasValue(data.Serial_number1) || this.hasValue(data.Serial_number) ||
        this.hasValue(data.Registration_status) || this.hasValue(data.Make1) || this.hasValue(data.Model) ||
        this.hasValue(data.Type1) || this.hasValue(data.Year_Built1) || this.hasValue(data.Total_airframe_hours)) {
      this.addSection('Aircraft Information');

      const regNumber = data.Registration_number && data.Serial_number1
        ? `${data.Registration_number}-${data.Serial_number1}`
        : data.Registration_number;

      if (this.hasValue(regNumber)) {
        this.addField('Registration Number', regNumber);
      }
      if (this.hasValue(data.Serial_number) || this.hasValue(data.Registration_status)) {
        this.addFieldPair('Serial Number', data.Serial_number, 'Registration Status', data.Registration_status);
      }
      if (this.hasValue(data.Make1) || this.hasValue(data.Model)) {
        this.addFieldPair('Make', data.Make1, 'Model', data.Model);
      }
      if (this.hasValue(data.Type1) || this.hasValue(data.Year_Built1)) {
        this.addFieldPair('Type', data.Type1, 'Year Built', data.Year_Built1);
      }
      if (this.hasValue(data.Total_airframe_hours)) {
        this.addField('Total Airframe Hours', data.Total_airframe_hours);
      }
    }

    // ========== ENGINE DETAILS ==========
    if (this.hasValue(data.Engine_Details) || this.hasValue(data.Engine_model) || this.hasValue(data.Engine_serial) ||
        this.hasValue(data.Total_engine_hours) || this.hasValue(data.Total_hours_since_service)) {
      this.addSection('Engine Details');

      if (this.hasValue(data.Engine_Details) || this.hasValue(data.Engine_model)) {
        this.addFieldPair('Engine Make', data.Engine_Details, 'Engine Model', data.Engine_model);
      }
      if (this.hasValue(data.Engine_serial) || this.hasValue(data.Total_engine_hours)) {
        this.addFieldPair('Engine Serial', data.Engine_serial, 'Total Engine Hours', data.Total_engine_hours);
      }
      if (this.hasValue(data.Total_hours_since_service)) {
        this.addField('Hours Since Service', data.Total_hours_since_service);
      }
    }

    // ========== PROPELLER DETAILS ==========
    if (this.hasValue(data.Propeller_make) || this.hasValue(data.Propeller_model) || this.hasValue(data.Propeller_serial)) {
      this.addSection('Propeller Details');

      if (this.hasValue(data.Propeller_make) || this.hasValue(data.Propeller_model)) {
        this.addFieldPair('Propeller Make', data.Propeller_make, 'Propeller Model', data.Propeller_model);
      }
      if (this.hasValue(data.Propeller_serial)) {
        this.addField('Propeller Serial', data.Propeller_serial);
      }
    }

    // ========== MAINTAINER INFORMATION ==========
    if (this.hasValue(data.Maintainer_Name) || this.hasValue(data.Maintainer_Last_Name) ||
        this.hasValue(data.Maintainer_Member_Number) || this.hasValue(data.Maintainer_Level)) {
      this.addSection('Maintainer Information');

      if (this.hasValue(data.Maintainer_Name) || this.hasValue(data.Maintainer_Last_Name)) {
        this.addFieldPair('Maintainer First Name', data.Maintainer_Name, 'Maintainer Last Name', data.Maintainer_Last_Name);
      }
      if (this.hasValue(data.Maintainer_Member_Number) || this.hasValue(data.Maintainer_Level)) {
        this.addFieldPair('Member Number', data.Maintainer_Member_Number, 'Maintainer Level', data.Maintainer_Level);
      }
    }

    // ========== SUBMISSION INFORMATION ==========
    if (metadata && (this.hasValue(metadata.occurrenceId) || this.hasValue(metadata.attachmentCount)) ||
        this.hasValue(data.atsbAcknowledgement)) {
      this.addSection('Submission Information');

      if (this.hasValue(metadata?.occurrenceId)) {
        this.addField('Occurrence ID', metadata.occurrenceId);
      }
      if (this.hasValue(metadata?.attachmentCount)) {
        this.addField('Attachments', `${metadata.attachmentCount} file(s) uploaded`);
      }
      if (this.hasValue(data.atsbAcknowledgement)) {
        this.addField('ATSB Acknowledgement', data.atsbAcknowledgement ? 'Acknowledged' : 'Not Acknowledged');
      }
    }

    // Add footer
    this.addFooter(
      formatDate(metadata?.timestamp || new Date().toISOString()),
      metadata?.occurrenceId
    );

    return this.getBuffer();
  }
}

export async function generateAccidentPDF(
  data: AccidentFormData,
  metadata?: any
): Promise<Buffer> {
  const generator = new AccidentPDFGenerator();
  return generator.generate(data, metadata);
}
