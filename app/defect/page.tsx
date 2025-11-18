"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { PhoneInput } from "@/components/ui/PhoneInput";
import { FileUpload } from "@/components/ui/FileUpload";
import { Button } from "@/components/ui/Button";
import MapPicker from "@/components/ui/MapPicker";
import { DefectFormData } from "@/types/forms";
import {
  validationPatterns,
  validationMessages,
  validateEmail,
} from "@/lib/validations/patterns";
import {
  useFormPersistence,
  useSpecialStatePersistence,
  clearFormOnSubmission,
} from "@/lib/utils/formPersistence";
import DefectPreview from "@/components/forms/DefectPreview";
import axios, { AxiosError } from "axios";
import Link from "next/link";
import "./defect-style.css";

// API Response Types
interface SubmissionResponse {
  success: boolean;
  formType: string;
  formData: DefectFormData;
  metadata?: {
    occurrenceId?: string;
  };
  error?: string;
}

interface MemberValidationResponse {
  valid: boolean;
  warning?: string;
}

interface AircraftLookupResponse {
  success: boolean;
  data?: {
    [key: string]: string | number | boolean;
  };
  message?: string;
}

const roleOptions = [
  { value: "", label: "- Please Select -" },
  { value: "Aircraft Owner", label: "Aircraft Owner" },
  { value: "Maintainer", label: "Maintainer" },
  { value: "Pilot in Command", label: "Pilot in Command" },
  { value: "Witness", label: "Witness" },
  { value: "Other", label: "Other" },
];

const stateOptions = [
  { value: "", label: "- Please Select -" },
  { value: "ACT", label: "ACT" },
  { value: "NSW", label: "NSW" },
  { value: "NT", label: "NT" },
  { value: "QLD", label: "QLD" },
  { value: "SA", label: "SA" },
  { value: "TAS", label: "TAS" },
  { value: "VIC", label: "VIC" },
  { value: "WA", label: "WA" },
];

const registrationPrefixOptions = [
  { value: "", label: "- Please Select -" },
  { value: "E24", label: "E24" },
  { value: "E23", label: "E23" },
  { value: "10", label: "10" },
  { value: "17", label: "17" },
  { value: "18", label: "18" },
  { value: "19", label: "19" },
  { value: "23", label: "23" },
  { value: "24", label: "24" },
  { value: "25", label: "25" },
  { value: "26", label: "26" },
  { value: "28", label: "28" },
  { value: "29", label: "29" },
  { value: "32", label: "32" },
  { value: "34", label: "34" },
  { value: "55", label: "55" },
];

const registrationStatusOptions = [
  { value: "", label: "-None-" },
  { value: "Allocated Number", label: "Allocated Number" },
  { value: "Blocked", label: "Blocked" },
  { value: "Deregistered", label: "Deregistered" },
  { value: "Destroyed", label: "Destroyed" },
  { value: "Full Registration", label: "Full Registration" },
  { value: "Provisional Registration", label: "Provisional Registration" },
  { value: "Suspended", label: "Suspended" },
  { value: "Cancelled", label: "Cancelled" },
];

const aircraftTypeOptions = [
  { value: "", label: "- Please Select -" },
  { value: "Three Axis Aeroplane", label: "Three Axis Aeroplane" },
  { value: "Weight-Shift Controlled Aeroplane", label: "Weight-Shift Controlled Aeroplane" },
  { value: "Powered Parachute", label: "Powered Parachute" },
];

const maintainerLevelOptions = [
  { value: "", label: "- Please Select -" },
  { value: "Level 1 Maintainer (L1)", label: "Level 1 Maintainer (L1)" },
  { value: "Level 2 Maintainer (L2)", label: "Level 2 Maintainer (L2)" },
  { value: "Level 4 Maintainer (L4)", label: "Level 4 Maintainer (L4)" },
];

// Generate year options from 1935 to current year + 1
const currentYear = new Date().getFullYear();
const yearOptions = Array.from({ length: currentYear - 1934 }, (_, i) => {
  const year = (1935 + i).toString();
  return { value: year, label: year };
});

export default function DefectForm() {
  // Form state management
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submissionData, setSubmissionData] =
    useState<SubmissionResponse | null>(null);
  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);

  // Validation states - Person Reporting
  const [memberValidationStatus, setMemberValidationStatus] = useState<
    "valid" | "invalid" | ""
  >("");
  const [memberValidationMessage, setMemberValidationMessage] = useState("");
  const [isValidatingMember, setIsValidatingMember] = useState(false);

  // Validation states - Maintainer
  const [maintainerValidationStatus, setMaintainerValidationStatus] =
    useState<"valid" | "invalid" | "">("");
  const [maintainerValidationMessage, setMaintainerValidationMessage] =
    useState("");
  const [isValidatingMaintainer, setIsValidatingMaintainer] = useState(false);

  // Defect occurrence state
  const [defectDate, setDefectDate] = useState("");
  const [defectTime, setDefectTime] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactPhoneValid, setContactPhoneValid] = useState(false);
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");

  // Form data state
  const [attachments, setAttachments] = useState<FileList | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState<DefectFormData | null>(null);

  // Aircraft lookup state
  const [isLookingUpAircraft, setIsLookingUpAircraft] = useState(false);
  const [aircraftLookupStatus, setAircraftLookupStatus] = useState<
    "success" | "error" | ""
  >("");
  const [aircraftLookupMessage, setAircraftLookupMessage] = useState("");

  // Aircraft data edit tracking state
  const [originalAircraftData, setOriginalAircraftData] = useState<Record<string, any>>({});
  const [hasEditedAircraftData, setHasEditedAircraftData] = useState(false);
  const [aircraftEditNote, setAircraftEditNote] = useState("");
  const [aircraftEditNoteError, setAircraftEditNoteError] = useState("");
  const [aircraftFieldChanges, setAircraftFieldChanges] = useState<Array<{
    fieldName: string;
    fieldLabel: string;
    originalValue: string;
    newValue: string;
  }>>([]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<DefectFormData>();

  // Function to check if aircraft data has been manually edited
  const checkForAircraftDataEdits = () => {
    if (Object.keys(originalAircraftData).length === 0) {
      return; // No original data to compare against
    }

    const fieldMap = {
      serialNumber: "Serial Number",
      make: "Make",
      model: "Model", 
      registrationStatus: "Registration Status",
      type: "Aircraft Type",
      Year_Built: "Year Built",
      engineMake: "Engine Make",
      engineModel: "Engine Model",
      engineSerial: "Engine Serial",
      propellerMake: "Propeller Make",
      propellerModel: "Propeller Model",
      propellerSerial: "Propeller Serial",
    };

    const currentValues = {
      serialNumber: watch("serialNumber") || "",
      make: watch("make") || "",
      model: watch("model") || "",
      registrationStatus: watch("registrationStatus") || "",
      type: watch("type") || "",
      Year_Built: watch("Year_Built") || "",
      engineMake: watch("engineMake") || "",
      engineModel: watch("engineModel") || "",
      engineSerial: watch("engineSerial") || "",
      propellerMake: watch("propellerMake") || "",
      propellerModel: watch("propellerModel") || "",
      propellerSerial: watch("propellerSerial") || "",
    };

    // Track detailed field changes
    const changes = Object.keys(originalAircraftData)
      .map(key => {
        const originalValue = String(originalAircraftData[key]).trim();
        const currentValue = String(currentValues[key as keyof typeof currentValues]).trim();
        
        if (originalValue !== currentValue) {
          return {
            fieldName: key,
            fieldLabel: fieldMap[key as keyof typeof fieldMap] || key,
            originalValue: originalValue || "(empty)",
            newValue: currentValue || "(empty)",
          };
        }
        return null;
      })
      .filter(change => change !== null);

    const hasChanges = changes.length > 0;

    // Update field changes state
    setAircraftFieldChanges(changes as any);

    if (hasChanges !== hasEditedAircraftData) {
      setHasEditedAircraftData(hasChanges);
      if (!hasChanges) {
        setAircraftEditNote(""); // Clear note if user reverted changes
        setAircraftEditNoteError("");
        setAircraftFieldChanges([]); // Clear field changes
      }
    }
  };

  // Watch aircraft fields for changes
  const watchedSerial = watch("serialNumber");
  const watchedMake = watch("make");
  const watchedModel = watch("model");
  const watchedRegStatus = watch("registrationStatus");
  const watchedType = watch("type");
  const watchedYear = watch("Year_Built");
  const watchedEngineM = watch("engineMake");
  const watchedEngineModel = watch("engineModel");
  const watchedEngineSerial = watch("engineSerial");
  const watchedPropellerMake = watch("propellerMake");
  const watchedPropellerModel = watch("propellerModel");
  const watchedPropellerSerial = watch("propellerSerial");

  // Check for edits whenever any aircraft field changes
  useEffect(() => {
    checkForAircraftDataEdits();
  }, [
    watchedSerial,
    watchedMake,
    watchedModel,
    watchedRegStatus,
    watchedType,
    watchedYear,
    watchedEngineM,
    watchedEngineModel,
    watchedEngineSerial,
    watchedPropellerMake,
    watchedPropellerModel,
    watchedPropellerSerial,
    originalAircraftData,
  ]);

  // Watch role for "Other" option
  const selectedRole = watch("role");

  // Form persistence
  const { clearCurrentForm } = useFormPersistence(
    { formType: 'defect' }, 
    watch, 
    setValue, 
    reset
  );

  // Special state persistence (includes GPS coordinates)
  const { clearSpecialState } = useSpecialStatePersistence(
    'defect',
    undefined,
    { defectDate, defectTime, contactPhone, latitude, longitude },
    {
      defectDate: setDefectDate,
      defectTime: setDefectTime,
      contactPhone: setContactPhone,
      latitude: setLatitude,
      longitude: setLongitude
    }
  );

  // Comprehensive form clearing function
  const clearAllFormData = () => {
    // Clear sessionStorage
    clearFormOnSubmission('defect');

    // Reset React Hook Form
    reset();

    // Clear special state (dates, phone, GPS)
    clearSpecialState();

    // Clear file attachments
    setAttachments(null);

    // Clear validation states
    setMemberValidationStatus("");
    setMemberValidationMessage("");
    setMaintainerValidationStatus("");
    setMaintainerValidationMessage("");

    // Clear aircraft lookup status
    setAircraftLookupStatus("");
    setAircraftLookupMessage("");

    // Clear aircraft data edit tracking
    setOriginalAircraftData({});
    setHasEditedAircraftData(false);
    setAircraftEditNote("");
    setAircraftEditNoteError("");
  };

  // Watch registration fields for aircraft lookup
  const registrationPrefix = watch("registrationNumberPrefix");
  const registrationSuffix = watch("registrationNumberSuffix");

  // Watch member validation fields
  const reporterMemberNumber = watch("memberNumber");
  const reporterFirstName = watch("firstName");
  const reporterLastName = watch("lastName");

  // Watch maintainer validation fields
  const maintainerMemberNumber = watch("maintainerMemberNumber");
  const maintainerFirstName = watch("Maintainer_Name");
  const maintainerLastName = watch("Maintainer_Last_Name");

  // Auto-lookup aircraft when both prefix and suffix are provided
  useEffect(() => {
    // AbortController to cancel previous requests
    const abortController = new AbortController();

    if (registrationPrefix && registrationSuffix) {
      // Debounce the lookup to avoid excessive API calls
      const timeoutId = setTimeout(() => {
        lookupAircraft(registrationPrefix, registrationSuffix, abortController.signal);
      }, 500);

      return () => {
        clearTimeout(timeoutId);
        abortController.abort(); // Cancel any pending request
      };
    } else {
      // Clear aircraft lookup status when fields are empty
      setAircraftLookupStatus("");
      setAircraftLookupMessage("");
      
      // Clear auto-populated aircraft fields when registration is removed
      setValue("serialNumber", "");
      setValue("make", "");
      setValue("model", "");
      setValue("registrationStatus", undefined);
      setValue("type", undefined);
      setValue("Year_Built", "");
      setValue("engineMake", "");
      setValue("engineModel", "");
      setValue("engineSerial", "");
      setValue("propellerMake", "");
      setValue("propellerModel", "");
      setValue("propellerSerial", "");
      
      // Reset aircraft edit tracking state
      setOriginalAircraftData({});
      setHasEditedAircraftData(false);
      setAircraftEditNote("");
      setAircraftEditNoteError("");
    }
  }, [registrationPrefix, registrationSuffix]);

  // Debounced validation for reporter member number
  useEffect(() => {
    const abortController = new AbortController();

    if (reporterMemberNumber && reporterFirstName && reporterLastName) {
      // Debounce validation to avoid excessive API calls
      const timeoutId = setTimeout(() => {
        validateMember(
          reporterMemberNumber,
          reporterFirstName,
          reporterLastName,
          abortController.signal
        );
      }, 800); // 800ms debounce for better UX

      return () => {
        clearTimeout(timeoutId);
        abortController.abort();
      };
    } else {
      // Clear validation status when fields are incomplete
      setMemberValidationStatus("");
      setMemberValidationMessage("");
    }
  }, [reporterMemberNumber, reporterFirstName, reporterLastName]);

  // Debounced validation for maintainer member number
  useEffect(() => {
    const abortController = new AbortController();

    if (maintainerMemberNumber && maintainerFirstName && maintainerLastName) {
      // Debounce validation to avoid excessive API calls
      const timeoutId = setTimeout(() => {
        validateMaintainer(
          maintainerMemberNumber,
          maintainerFirstName,
          maintainerLastName,
          abortController.signal
        );
      }, 800); // 800ms debounce for better UX

      return () => {
        clearTimeout(timeoutId);
        abortController.abort();
      };
    } else {
      // Clear validation status when fields are incomplete
      setMaintainerValidationStatus("");
      setMaintainerValidationMessage("");
    }
  }, [maintainerMemberNumber, maintainerFirstName, maintainerLastName]);

  // Helper function to convert text to Title Case
  const toTitleCase = (str: string): string => {
    if (!str) return str;
    return str
      .toLowerCase()
      .split(' ')
      .map(word => {
        if (word.length === 0) return word;
        return word.charAt(0).toUpperCase() + word.slice(1);
      })
      .join(' ');
  };

  // Validate member number with immediate feedback (with debounce and cancellation)
  const validateMember = async (
    memberNumber: string,
    firstName: string,
    lastName: string,
    abortSignal?: AbortSignal
  ): Promise<void> => {
    // Reset validation if any field is empty
    if (!memberNumber || !firstName || !lastName) {
      setMemberValidationStatus("");
      setMemberValidationMessage("");
      return;
    }

    // Validate member number format (must be exactly 6 digits)
    if (memberNumber.length !== 6 || !/^\d{6}$/.test(memberNumber)) {
      setMemberValidationStatus("");
      setMemberValidationMessage("");
      return;
    }

    setIsValidatingMember(true);

    try {
      const response = await axios.post<MemberValidationResponse>(
        "/api/validate-member",
        {
          memberNumber,
          firstName,
          lastName,
        },
        {
          signal: abortSignal,
        }
      );

      if (response.data.valid) {
        setMemberValidationStatus("valid");
        setMemberValidationMessage("✓ Member Number exists in system");
      } else {
        setMemberValidationStatus("invalid");
        setMemberValidationMessage(
          response.data.warning || "Member Number not found"
        );
      }
    } catch (error: any) {
      // Don't show error if request was cancelled
      if (axios.isCancel(error) || error.name === 'CanceledError') {
        return;
      }
      console.error("Member validation error:", error);
      setMemberValidationStatus("invalid");
      setMemberValidationMessage("Unable to validate Member Number");
    } finally {
      setIsValidatingMember(false);
    }
  };

  // Validate maintainer member number with immediate feedback (with debounce and cancellation)
  const validateMaintainer = async (
    memberNumber: string,
    firstName: string,
    lastName: string,
    abortSignal?: AbortSignal
  ): Promise<void> => {
    // Reset validation if any field is empty
    if (!memberNumber || !firstName || !lastName) {
      setMaintainerValidationStatus("");
      setMaintainerValidationMessage("");
      return;
    }

    // Validate member number format (must be exactly 6 digits)
    if (memberNumber.length !== 6 || !/^\d{6}$/.test(memberNumber)) {
      setMaintainerValidationStatus("");
      setMaintainerValidationMessage("");
      return;
    }

    setIsValidatingMaintainer(true);

    try {
      const response = await axios.post<MemberValidationResponse>(
        "/api/validate-member",
        {
          memberNumber,
          firstName,
          lastName,
        },
        {
          signal: abortSignal,
        }
      );

      if (response.data.valid) {
        setMaintainerValidationStatus("valid");
        setMaintainerValidationMessage("✓ Member Number exists in system");
      } else {
        setMaintainerValidationStatus("invalid");
        setMaintainerValidationMessage(
          response.data.warning || "Member Number not found"
        );
      }
    } catch (error: any) {
      // Don't show error if request was cancelled
      if (axios.isCancel(error) || error.name === 'CanceledError') {
        return;
      }
      console.error("Maintainer validation error:", error);
      setMaintainerValidationStatus("invalid");
      setMaintainerValidationMessage("Unable to validate Member Number");
    } finally {
      setIsValidatingMaintainer(false);
    }
  };

  // Aircraft lookup function
  const lookupAircraft = async (registrationPrefix: string, registrationSuffix: string, signal?: AbortSignal) => {
    // Reset lookup status
    if (!registrationPrefix || !registrationSuffix) {
      setAircraftLookupStatus("");
      setAircraftLookupMessage("");
      return;
    }

    // Validate suffix is 4 digits
    const cleanSuffix = registrationSuffix.replace(/\D/g, '');
    if (cleanSuffix.length !== 4) {
      setAircraftLookupStatus("error");
      setAircraftLookupMessage("Registration suffix must be exactly 4 digits");
      return;
    }

    // Combine prefix and suffix
    const combinedRegistration = `${registrationPrefix}-${cleanSuffix}`;
    
    setIsLookingUpAircraft(true);
    setAircraftLookupStatus("");
    setAircraftLookupMessage("");

    try {
      const response = await axios.post("/api/aircraft-lookup", {
        aircraftConcat: combinedRegistration,
      }, {
        signal: signal
      });

      if (response.data.success && response.data.data) {
        const aircraftData = response.data.data;
        
        // Normalize Year_Built to just the 4-digit year for comparison
        let normalizedYear = "";
        const rawYearBuilt = String(aircraftData.Year_Built || aircraftData.Manufacturer_Date || "");
        if (rawYearBuilt && rawYearBuilt.trim() !== "") {
          const yearMatch = rawYearBuilt.match(/(\d{4})/);
          if (yearMatch) {
            const year = yearMatch[1];
            const yearNum = parseInt(year);
            if (yearNum >= 1935 && yearNum <= 2025) {
              normalizedYear = year;
            }
          }
        }

        // Store original aircraft data for edit tracking
        const originalData = {
          serialNumber: String(aircraftData.Serial_Number1 || ""),
          make: String(aircraftData.Manufacturer || ""),
          model: String(aircraftData.Model || ""),
          registrationStatus: aircraftData.Registration_Type || "",
          type: aircraftData.Type || "",
          Year_Built: normalizedYear,
          engineMake: String(aircraftData.Engine_Details || ""),
          engineModel: String(aircraftData.Engine_model || ""),
          engineSerial: String(aircraftData.Engines_Serial || ""),
          propellerMake: String(aircraftData.Propeller_make || ""),
          propellerModel: String(aircraftData.Propeller_model || ""),
          propellerSerial: String(aircraftData.Propeller_serial || ""),
        };
        setOriginalAircraftData(originalData);
        setHasEditedAircraftData(false); // Reset edit flag when new data is loaded
        setAircraftEditNote(""); // Clear any previous edit note
        setAircraftEditNoteError(""); // Clear any previous error
        
        // Auto-fill aircraft fields - use empty string as fallback for null/undefined
        setValue("serialNumber", originalData.serialNumber || "");
        setValue("make", originalData.make || "");
        setValue("model", originalData.model || "");
        setValue("registrationStatus", originalData.registrationStatus || "");
        setValue("type", originalData.type || "");
        // Year Built - use the already normalized year
        if (normalizedYear) {
          setValue("Year_Built", normalizedYear);
        }

        // Auto-fill engine fields
        setValue("engineMake", originalData.engineMake || "");
        setValue("engineModel", originalData.engineModel || "");
        setValue("engineSerial", originalData.engineSerial || "");

        // Auto-fill propeller fields
        setValue("propellerMake", originalData.propellerMake || "");
        setValue("propellerModel", originalData.propellerModel || "");
        setValue("propellerSerial", originalData.propellerSerial || "");

        let fieldsPopulated = 0;
        const aircraftFields = ["serialNumber", "make", "model", "registrationStatus", "type", "Year_Built"];
        const engineFields = ["engineMake", "engineModel", "engineSerial"];
        const propellerFields = ["propellerMake", "propellerModel", "propellerSerial"];
        
        aircraftFields.forEach(field => {
          const apiField = field === "serialNumber" ? "Serial_Number1" : 
                          field === "make" ? "Manufacturer" :
                          field === "model" ? "Model" :
                          field === "registrationStatus" ? "Registration_Type" :
                          field === "type" ? "Type" :
                          field === "Year_Built" ? "Year_Built" : field;
          if (aircraftData[apiField]) fieldsPopulated++;
        });
        engineFields.forEach(field => {
          const apiField = field === "engineMake" ? "Engine_Details" :
                          field === "engineModel" ? "Engine_model" :
                          field === "engineSerial" ? "Engines_Serial" : field;
          if (aircraftData[apiField]) fieldsPopulated++;
        });
        propellerFields.forEach(field => {
          const apiField = field === "propellerMake" ? "Propeller_make" :
                          field === "propellerModel" ? "Propeller_model" :
                          field === "propellerSerial" ? "Propeller_serial" : field;
          if (aircraftData[apiField]) fieldsPopulated++;
        });

        setAircraftLookupStatus("success");
        const message = `✓ Aircraft data loaded for ${combinedRegistration} (${fieldsPopulated} fields populated)`;
        if (aircraftData.propeller_found) {
          setAircraftLookupMessage(message + " - Propeller data included");
        } else {
          setAircraftLookupMessage(message + " - No propeller data found");
        }
        
        // Clear success message after 5 seconds
        setTimeout(() => {
          if (aircraftLookupStatus === "success") {
            setAircraftLookupMessage("");
          }
        }, 5000);
      } else {
        setAircraftLookupStatus("error");
        setAircraftLookupMessage(response.data.message || `No aircraft found for registration ${combinedRegistration}`);
      }
    } catch (error: any) {
      setAircraftLookupStatus("error");
      setAircraftLookupMessage("Unable to lookup aircraft data. Please try again.");
      console.error("Aircraft lookup error:", error);
    } finally {
      setIsLookingUpAircraft(false);
    }
  };

  // Validate and show preview
  const handlePreview = (data: DefectFormData): void => {
    // Validate required fields before showing preview
    if (!defectDate || !defectTime) {
      alert("Please provide both defect date and time");
      return;
    }

    if (!contactPhone) {
      alert("Please provide a contact phone number");
      return;
    }

    if (!contactPhoneValid) {
      alert("Please enter a valid phone number for the selected country");
      return;
    }

    // Store form data and show preview
    setPreviewData(data);
    setShowPreview(true);
  };

  // Return to edit mode from preview
  const handleBackToEdit = (): void => {
    setShowPreview(false);
  };

  // Submit form data
  const onSubmit = async (): Promise<void> => {
    if (!previewData) {
      console.error("No preview data available for submission");
      return;
    }

    setIsSubmitting(true);

    try {
      const data = previewData;

      // Validate required fields
      if (!defectDate || !defectTime) {
        alert("Please provide both defect date and time");
        return;
      }

      if (!contactPhone) {
        alert("Please provide a contact phone number");
        return;
      }

      // Validate aircraft edit note if data was modified
      if (hasEditedAircraftData) {
        if (!aircraftEditNote || aircraftEditNote.trim() === "") {
          alert("Please provide a reason for editing the prepopulated aircraft data");
          return;
        }
        if (aircraftEditNote.trim().length < 5) {
          alert("Reason for aircraft data edit must be at least 5 characters long");
          return;
        }
      }

      // Convert date and time to ISO format
      const datetime = new Date(`${defectDate}T${defectTime}`);
      if (isNaN(datetime.getTime())) {
        alert("Invalid date or time provided");
        return;
      }

      // Prepare form data for unified API
      const formData = new FormData();

      // Add form type
      formData.append("formType", "defect");

      const submissionPayload = {
        // Map to CRM field names for consistency
        Role:
          data.role === "Other" && data.customRole?.trim()
            ? data.customRole.trim()
            : data.role,
        Name1: data.firstName,
        Member_Number: data.memberNumber,
        Reporter_First_Name: data.firstName,
        Reporter_Email: data.email,
        Contact_Phone: contactPhone,
        Last_Name: data.lastName,
        Occurrence_Date1: datetime.toISOString().slice(0, 19), // YYYY-MM-DDTHH:mm:ss
        Location_of_aircraft_when_defect_was_found: data.locationOfAircraft,
        Location: data.locationOfAircraft,
        // GPS Coordinates
        Latitude: latitude || "",
        Longitude: longitude || "",
        State: data.state,
        Description_of_Occurrence: data.defectDescription,
        Defective_component: data.defectiveComponent,
        Provide_description_of_defect: data.defectDescription,

        // Maintainer Information
        Maintainer_Name: data.Maintainer_Name || "",
        Maintainer_Last_Name: data.Maintainer_Last_Name || "",
        Maintainer_Member_Number: data.maintainerMemberNumber,
        Maintainer_Level: data.maintainerLevel,
        Do_you_have_further_suggestions_on_how_to_PSO:
          data.preventionSuggestions,
        Reporter_Suggestions: data.preventionSuggestions,

        // Aircraft Information
        Registration_number:
          data.registrationNumberPrefix && data.registrationNumberSuffix
            ? `${data.registrationNumberPrefix}-${data.registrationNumberSuffix}`
            : "",
        Registration_status: data.registrationStatus,
        Serial_number: data.serialNumber,
        Make: data.make,
        Model: data.model,
        Type1: data.type,
        Year_Built: data.Year_Built,

        // Engine Details
        Engine_Details: data.engineMake,
        Engine_model: data.engineModel,
        Engine_serial: data.engineSerial,
        Total_engine_hours: data.totalEngineHours,
        Total_hours_since_service: data.totalHoursSinceService,

        // Propeller Details
        Propeller_make: data.propellerMake,
        Propeller_model: data.propellerModel,
        Propeller_serial: data.propellerSerial,

        // Aircraft Edit Tracking
        Aircraft_Data_Modified: hasEditedAircraftData,
        Aircraft_Edit_Note: hasEditedAircraftData ? aircraftEditNote.trim() : "",
        Aircraft_Field_Changes: hasEditedAircraftData ? aircraftFieldChanges : [],

        // Legacy aliases for backward compatibility
        contactPhone: contactPhone,
        dateDefectIdentified: datetime.toISOString().slice(0, 19),
      };

      formData.append("formData", JSON.stringify(submissionPayload));

      // Add attachments if any
      if (attachments && attachments.length > 0) {
        Array.from(attachments).forEach((file, index) => {
          formData.append(`file_${index}`, file);
        });
      }

      // Submit to unified API endpoint
      const response = await axios.post<SubmissionResponse>(
        "/api/submit-form",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.data.success) {
        setSubmissionData(response.data);
        clearFormOnSubmission("defect");
        setShowPreview(false);
        setSubmitSuccess(true);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        throw new Error(
          response.data.error || "Failed to process defect report"
        );
      }
    } catch (error) {
      console.error("Form submission error:", error);

      let errorMessage = "Failed to submit form. Please try again.";

      if (axios.isAxiosError(error)) {
        if (error.response?.data?.error) {
          errorMessage = error.response.data.error;
        } else if (error.response?.data?.data?.[0]?.message) {
          errorMessage = error.response.data.data[0].message;
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      alert(`Submission Error: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Download PDF report
  const downloadPDF = async (): Promise<void> => {
    if (!submissionData) {
      console.error("No submission data available for PDF generation");
      return;
    }

    setIsDownloadingPDF(true);

    try {
      const response = await axios.post(
        "/api/generate-pdf",
        {
          formType: "defect",
          formData: submissionData.formData,
          metadata: submissionData.metadata,
        },
        {
          responseType: "blob",
        }
      );

      // Create blob from response
      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);

      // Create and trigger download link
      const link = document.createElement("a");
      link.href = url;
      link.download = `RAAus_Defect_Report_${
        submissionData.metadata?.occurrenceId || Date.now()
      }.pdf`;
      document.body.appendChild(link);
      link.click();

      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("PDF download error:", error);
      alert("Failed to download PDF. Please try again.");
    } finally {
      setIsDownloadingPDF(false);
    }
  };

  // Show preview screen
  if (showPreview && previewData) {
    return (
      <DefectPreview
        data={previewData}
        defectDate={defectDate}
        defectTime={defectTime}
        contactPhone={contactPhone}
        latitude={latitude}
        longitude={longitude}
        attachments={attachments}
        onBack={handleBackToEdit}
        onConfirm={onSubmit}
        isSubmitting={isSubmitting}
      />
    );
  }

  if (submitSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Defect Report Submitted</h2>
          <p className="text-gray-600 mb-4">
            Your defect report has been successfully submitted to RAAus. You will receive a confirmation email shortly.
          </p>
          
          {submissionData?.metadata?.occurrenceId && (
            <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-800">
                <strong>Occurrence ID:</strong> {submissionData.metadata.occurrenceId}
              </p>
            </div>
          )}

          <div className="space-y-3">
            <Button 
              onClick={downloadPDF} 
              disabled={isDownloadingPDF}
              className="w-full"
            >
              {isDownloadingPDF ? "Generating PDF..." : "Download PDF Copy"}
            </Button>
            <Button 
              onClick={() => (window.location.href = "/")}
              variant="outline"
              className="w-full"
            >
              Return to Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-200 py-8 px-4">
      <div className="max-w-4xl mx-auto">

        {/* Breadcrumb Style */}
        <div className="mb-6 lg:mb-0 relative lg:-left-10 xl:-left-32 -mt-2">
          <nav className="flex items-center text-md text-gray-600" aria-label="Breadcrumb">
            <ol className="inline-flex items-center space-x-1 md:space-x-3">
              <li className="inline-flex items-center">
                <Link href="/" className="inline-flex items-center text-blue-600 hover:text-blue-800">
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2L2 12h3v8h6v-6h2v6h6v-8h3L12 2z" />
                  </svg>
                  Home
                </Link>
              </li>
              <li>
                <div className="flex items-center">
                  /<span className="text-slate-900 ml-2">Defect Form</span>
                </div>
              </li>
            </ol>
          </nav>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 text-center w-full mb-6">Lodge a New Defect</h1>
        </div>

        <form onSubmit={handleSubmit(handlePreview)} className="space-y-6 border border-gray-300 rounded-lg shadow-lg bg-white defect-form">
          {/* Person Reporting Section */}
          <div className="rounded-lg p-8 pt-10">
            <div className="mb-6 border-b-2 border-gray-300 pb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Person Reporting
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-4">
              <div>
                <Select
                  label="Role"
                  required
                  options={roleOptions}
                  {...register("role", { required: "Role is required" })}
                  error={errors.role?.message}
                />
                
                {/* Custom Role Input - Shows when 'Other' is selected */}
                {selectedRole === "Other" && (
                  <div className="mt-3">
                    <Input
                      label="Please specify your role"
                      placeholder="e.g., Flight Instructor, Engineer, Manager"
                      maxLength={100}
                      error={errors.customRole?.message}
                      onKeyPress={(e) => {
                        // Allow letters, spaces, hyphens, periods, apostrophes
                        if (!/[a-zA-Z\s\-.']/i.test(e.key)) {
                          e.preventDefault();
                        }
                      }}
                      {...register("customRole", {
                        minLength: {
                          value: 2,
                          message: "Role must be at least 2 characters"
                        },
                        maxLength: {
                          value: 100,
                          message: "Role cannot exceed 100 characters"
                        },
                        pattern: {
                          value: /^[a-zA-Z\s\-.']+$/,
                          message: "Only letters, spaces, hyphens, periods and apostrophes are allowed"
                        },
                        onChange: (e) => {
                          // Auto-capitalize first letter of each word
                          const value = e.target.value;
                          if (value) {
                            const words = value.split(' ');
                            const capitalizedWords = words.map((word: string) => 
                              word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
                            );
                            e.target.value = capitalizedWords.join(' ');
                          }
                        }
                      })}
                    />
                  </div>
                )}
              </div>

              <div>
                <Input
                  label="Member Number"
                  type="text"
                  placeholder="123456"
                  maxLength={6}
                  onKeyPress={(e) => {
                    // Only allow numbers (0-9)
                    if (!/[0-9]/.test(e.key)) {
                      e.preventDefault();
                    }
                  }}
                  {...register("memberNumber", {
                    pattern: {
                      value: validationPatterns.memberNumber,
                      message: "Must be exactly 6 digits",
                    },
                    onChange: (e) => {
                      // Remove any non-numeric characters
                      e.target.value = e.target.value.replace(/[^0-9]/g, '');
                    },
                  })}
                  error={errors.memberNumber?.message}
                />
                {isValidatingMember && (
                  <p className="text-sm text-gray-500 mt-1">Validating...</p>
                )}
                {!isValidatingMember && memberValidationStatus === "valid" && (
                  <p className="text-sm text-green-600 mt-1 font-medium">{memberValidationMessage}</p>
                )}
                {!isValidatingMember && memberValidationStatus === "invalid" && (
                  <p className="text-sm text-red-600 mt-1">{memberValidationMessage}</p>
                )}
              </div>

              <Input
                label="First Name"
                type="text"
                placeholder="John"
                required
                maxLength={30}
                onKeyPress={(e) => {
                  // Only allow letters (a-z, A-Z) and spaces
                  if (!/[a-zA-Z ]/.test(e.key)) {
                    e.preventDefault();
                  }
                }}
                {...register("firstName", {
                  required: "First name is required",
                  pattern: {
                    value: validationPatterns.name,
                    message: validationMessages.name,
                  },
                  onChange: (e) => {
                    // Remove any non-letter/space characters
                    let value = e.target.value.replace(/[^a-zA-Z ]/g, '');
                    // Convert to Title Case
                    value = toTitleCase(value);
                    e.target.value = value;
                  },
                })}
                error={errors.firstName?.message}
              />

              <Input
                label="Last Name"
                type="text"
                placeholder="Doe"
                required
                maxLength={30}
                onKeyPress={(e) => {
                  // Only allow letters (a-z, A-Z) and spaces
                  if (!/[a-zA-Z ]/.test(e.key)) {
                    e.preventDefault();
                  }
                }}
                {...register("lastName", {
                  required: "Last name is required",
                  pattern: {
                    value: validationPatterns.name,
                    message: validationMessages.name,
                  },
                  onChange: (e) => {
                    // Remove any non-letter/space characters
                    let value = e.target.value.replace(/[^a-zA-Z ]/g, '');
                    // Convert to Title Case
                    value = toTitleCase(value);
                    e.target.value = value;
                  },
                })}
                error={errors.lastName?.message}
              />

              {/* Email field */}
              <Input
                label="Email"
                type="email"
                placeholder="example@domain.com"
                required
                {...register("email", {
                  required: "Email is required",
                  validate: (value) => !value || validateEmail(value) || "Please enter a valid email address (e.g., user@example.com)"
                })}
                error={errors.email?.message}
              />

              <PhoneInput
                label="Contact Phone"
                placeholder="0412 345 678"
                required
                value={contactPhone}
                onChange={(value) => setContactPhone(value)}
                onValidationChange={(isValid) => setContactPhoneValid(isValid)}
                defaultCountry="AU"
              />

              {/* Date of Birth - Shows when 'Pilot in Command' is selected */}
              {selectedRole === "Pilot in Command" && (
                <div className="md:col-start-2">
                  <Input
                    label="Date of Birth"
                    type="date"
                    min="1900-01-01"
                    max={(() => {
                      const today = new Date();
                      const maxDate = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
                      return maxDate.toISOString().split('T')[0];
                    })()}
                    {...register("Date_of_Birth", {
                      validate: (value) => {
                        if (!value) return true; // Optional field
                        
                        // Parse the date string (format: YYYY-MM-DD)
                        const birthDate = new Date(value + 'T00:00:00');
                        const today = new Date();
                        
                        // Calculate age in years
                        let age = today.getFullYear() - birthDate.getFullYear();
                        const monthDiff = today.getMonth() - birthDate.getMonth();
                        const dayDiff = today.getDate() - birthDate.getDate();
                        
                        // Adjust age if birthday hasn't occurred this year yet
                        if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
                          age--;
                        }
                        
                        // Must be at least 18 years old
                        if (age < 18) {
                          return "Pilot must be at least 18 years old";
                        }
                        
                        return true;
                      }
                    })}
                    error={errors.Date_of_Birth?.message}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Defect Information Section */}
          <div className="bg-white rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-8 border-b-2 border-gray-300 pb-4">
              Defect Information
            </h2>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date Defect Identified <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={defectDate}
                    onChange={(e) => {
                      const selectedDateStr = e.target.value;
                      const selectedDate = new Date(selectedDateStr + 'T00:00:00');
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      
                      // Only block if selected date is AFTER today
                      if (selectedDate.getTime() > today.getTime()) {
                        alert("Defect identification date cannot be in the future");
                        return;
                      }
                      
                      setDefectDate(selectedDateStr);
                    }}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="1900-01-01"
                    max={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Time Defect Identified <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    value={defectTime}
                    onChange={(e) => {
                      const selectedTime = e.target.value;
                      
                      // If today's date is selected, validate time is not in the future
                      if (defectDate) {
                        const selectedDate = new Date(defectDate);
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        
                        // If defect date is today
                        if (selectedDate.getTime() === today.getTime()) {
                          const [hours, minutes] = selectedTime.split(':');
                          const currentHours = new Date().getHours();
                          const currentMinutes = new Date().getMinutes();
                          
                          if (parseInt(hours) > currentHours || 
                              (parseInt(hours) === currentHours && parseInt(minutes) > currentMinutes)) {
                            alert("Defect identification time cannot be in the future");
                            return;
                          }
                        }
                      }
                      
                      setDefectTime(e.target.value);
                    }}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  label="State"
                  required
                  options={stateOptions}
                  {...register("state", { required: "State is required" })}
                  error={errors.state?.message}
                />
              </div>

              <Textarea
                label="Location of Aircraft When Defect Was Found"
                required
                rows={3}
                {...register("locationOfAircraft", { required: "Location is required" })}
                error={errors.locationOfAircraft?.message}
              />

              {/* GPS Coordinates */}
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Latitude"
                  type="text"
                  placeholder="-25.274398"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                />
                <Input
                  label="Longitude"
                  type="text"
                  placeholder="133.775136"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                />
              </div>

              <MapPicker
                latitude={latitude}
                longitude={longitude}
                onLocationSelect={(lat, lng) => {
                  setLatitude(lat);
                  setLongitude(lng);
                }}
                label="Pinpoint Location on Map (Optional)"
              />

              <Input
                label="Defective Component"
                type="text"
                placeholder="Enter defective part name…"
                required
                {...register("defectiveComponent", { required: "Defective component is required" })}
                error={errors.defectiveComponent?.message}
              />

              <Textarea
                label="Provide Description of Defect"
                required
                rows={3}
                placeholder="Describe the problem (symptoms, damage, etc.)…"
                {...register("defectDescription", { required: "Defect description is required" })}
                error={errors.defectDescription?.message}
              />

              <div className="bg-gray-50 p-4 rounded-md">
                <p className="text-sm text-gray-700 mb-4">
                  If the defect resulted in additional damage to the aircraft, please provide details.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Maintainer First Name"
                  type="text"
                  placeholder="Robert"
                  maxLength={60}
                  onKeyPress={(e) => {
                    // Only allow letters (a-z, A-Z) and spaces
                    if (!/[a-zA-Z ]/.test(e.key)) {
                      e.preventDefault();
                    }
                  }}
                  {...register("Maintainer_Name", {
                    pattern: {
                      value: /^[a-zA-Z\s]*$/,
                      message: "Letters and spaces only",
                    },
                    onChange: (e) => {
                      // Convert to Title Case
                      e.target.value = toTitleCase(e.target.value);
                    }
                  })}
                  error={errors.Maintainer_Name?.message}
                />

                <Input
                  label="Maintainer Last Name"
                  type="text"
                  placeholder="Johnson"
                  maxLength={60}
                  onKeyPress={(e) => {
                    // Only allow letters (a-z, A-Z) and spaces
                    if (!/[a-zA-Z ]/.test(e.key)) {
                      e.preventDefault();
                    }
                  }}
                  {...register("Maintainer_Last_Name", {
                    pattern: {
                      value: /^[a-zA-Z\s]*$/,
                      message: "Letters and spaces only",
                    },
                    onChange: (e) => {
                      // Convert to Title Case
                      e.target.value = toTitleCase(e.target.value);
                    }
                  })}
                  error={errors.Maintainer_Last_Name?.message}
                />

                <div>
                  <Input
                    label="Maintainer Member Number"
                    type="text"
                    placeholder="e.g. 123456"
                    maxLength={6}
                    helpText="Must be exactly 6 digits. If the maintainer was not a member, leave blank."
                    onKeyPress={(e) => {
                      // Only allow numbers (0-9)
                      if (!/[0-9]/.test(e.key)) {
                        e.preventDefault();
                      }
                    }}
                    {...register("maintainerMemberNumber", {
                      pattern: {
                        value: validationPatterns.memberNumber,
                        message: validationMessages.memberNumber,
                      },
                      minLength: {
                        value: 6,
                        message: validationMessages.memberNumber,
                      },
                      maxLength: {
                        value: 6,
                        message: validationMessages.memberNumber,
                      },
                      onChange: (e) => {
                        // Remove any non-numeric characters
                        e.target.value = e.target.value.replace(/[^0-9]/g, '');
                      }
                    })}
                    error={errors.maintainerMemberNumber?.message}
                  />
                  {isValidatingMaintainer && (
                    <p className="mt-1 text-sm text-blue-600">Validating member number...</p>
                  )}
                  {maintainerValidationMessage && (
                    <p className={`mt-1 text-sm ${
                      maintainerValidationStatus === "valid" ? "text-green-600 font-medium" : "text-red-600"
                    }`}>
                      {maintainerValidationMessage}
                    </p>
                  )}
                </div>
              </div>

              <Select
                label="Maintainer Level"
                options={maintainerLevelOptions}
                {...register("maintainerLevel")}
              />

              <Textarea
                label="Do You Have Further Suggestions on How to Prevent Similar Occurrences?"
                required
                rows={3}
                {...register("preventionSuggestions", { required: "Prevention suggestions are required" })}
                error={errors.preventionSuggestions?.message}
              />
            </div>
          </div>

          {/* Aircraft Information Section */}
          <div className="bg-white rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 border-b-2 border-gray-300 pb-4">
              Aircraft Information
            </h2>
            <div className="mb-8"></div>
            
            {/* Aircraft Data Pre-population Message */}
            {(!registrationPrefix || !registrationSuffix) ? (
              <div className="mb-4 p-3 rounded-md bg-blue-50 border border-blue-200 text-blue-700">
                Aircraft data will pre-populate based on aircraft prefix and registration number.
              </div>
            ) : (
              <div className="mb-4 p-3 rounded-md bg-green-50 border border-green-200 text-green-700">
                Please check pre-populated data is correct and amend any incorrect fields.
              </div>
            )}
            
            {/* Aircraft Lookup Status */}
            {(isLookingUpAircraft || aircraftLookupMessage) && (
              <div className={`mb-4 p-3 rounded-md ${
                isLookingUpAircraft 
                  ? 'bg-blue-50 border border-blue-200 text-blue-700'
                  : aircraftLookupStatus === 'success'
                  ? 'bg-green-50 border border-green-200 text-green-700'
                  : 'bg-red-50 border border-red-200 text-red-700'
              }`}>
                {isLookingUpAircraft ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Looking up aircraft data...
                  </div>
                ) : (
                  aircraftLookupMessage
                )}
              </div>
            )}
            
            {/* Aircraft Edit Detection and Note Field */}
            {hasEditedAircraftData && (
              <div className="mb-6 p-4 rounded-md bg-yellow-50 border border-yellow-200">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-yellow-800 mb-2">
                      Aircraft Data Modified
                    </h3>
                    <p className="text-sm text-yellow-700 mb-3">
                      You have modified the prepopulated aircraft data. Please provide a reason for the changes.
                    </p>
                    
                    {/* Show what fields were changed */}
                    {aircraftFieldChanges.length > 0 && (
                      <div className="mb-3 p-3 bg-yellow-100 border border-yellow-300 rounded-md">
                        <p className="text-sm font-medium text-yellow-800 mb-2">Fields Changed:</p>
                        <ul className="text-xs text-yellow-700 space-y-1">
                          {aircraftFieldChanges.map((change, index) => (
                            <li key={index} className="flex justify-between">
                              <span className="font-medium">{change.fieldLabel}:</span>
                              <span className="ml-2">
                                "{change.originalValue}" → "{change.newValue}"
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    <div>
                      <label className="block text-sm font-medium text-yellow-800 mb-1">
                        Reason for Edit <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        value={aircraftEditNote}
                        onChange={(e) => {
                          setAircraftEditNote(e.target.value);
                          if (e.target.value.trim()) {
                            setAircraftEditNoteError("");
                          }
                        }}
                        placeholder="e.g., Wrong aircraft make, Incorrect model number, Updated engine details..."
                        className={`w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
                          aircraftEditNoteError 
                            ? 'border-red-500 focus:ring-red-500' 
                            : 'border-yellow-300 focus:ring-yellow-500'
                        }`}
                        rows={2}
                        maxLength={250}
                      />
                      {aircraftEditNoteError && (
                        <p className="mt-1 text-sm text-red-600">{aircraftEditNoteError}</p>
                      )}
                      <p className="mt-1 text-xs text-yellow-600">
                        {aircraftEditNote.length}/250 characters
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  label="Registration Number Prefix"
                  required
                  options={registrationPrefixOptions}
                  {...register("registrationNumberPrefix", { required: "Registration prefix is required" })}
                  error={errors.registrationNumberPrefix?.message}
                />

                <Input
                  label="Registration Number Suffix"
                  type="text"
                  placeholder="1234"
                  required
                  maxLength={4}
                  onKeyPress={(e) => {
                    // Only allow numbers (0-9)
                    if (!/[0-9]/.test(e.key)) {
                      e.preventDefault();
                    }
                  }}
                  {...register("registrationNumberSuffix", {
                    required: "Registration suffix is required",
                    minLength: { value: 4, message: "Must be exactly 4 digits" },
                    maxLength: { value: 4, message: "Must be exactly 4 digits" },
                    pattern: { value: /^\d{4}$/, message: "Must be 4 digits" },
                    onChange: (e) => {
                      // Remove any non-numeric characters
                      e.target.value = e.target.value.replace(/[^0-9]/g, '');
                    }
                  })}
                  error={errors.registrationNumberSuffix?.message}
                />

                <Input
                  label="Serial Number"
                  type="text"
                  required
                  {...register("serialNumber", { 
                    required: "Serial number is required",
                    pattern: {
                      value: /^[a-zA-Z0-9 .\-]+$/,
                      message: "Serial number can only contain letters, numbers, spaces, dots, and hyphens"
                    }
                  })}
                  error={errors.serialNumber?.message}
                />

                <Select
                  label="Registration Status"
                  options={registrationStatusOptions}
                  {...register("registrationStatus")}
                />

                <Input
                  label="Make"
                  type="text"
                  required
                  {...register("make", { required: "Make is required" })}
                  error={errors.make?.message}
                />

                <Input
                  label="Model"
                  type="text"
                  required
                  {...register("model", { required: "Model is required" })}
                  error={errors.model?.message}
                />

                <Select
                  label="Year Built"
                  required
                  options={yearOptions}
                  {...register("Year_Built", { required: "Year built is required" })}
                  error={errors.Year_Built?.message}
                />

                <Select
                  label="Type"
                  required
                  options={aircraftTypeOptions}
                  {...register("type", { required: "Aircraft type is required" })}
                  error={errors.type?.message}
                />
              </div>
            </div>
          </div>

          {/* Engine Details Section */}
          <div className="bg-white rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-8 border-b-2 border-gray-300 pb-4">
              Engine Details (As applicable to defect report)
            </h2>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Engine Make"
                  type="text"
                  {...register("engineMake")}
                />

                <Input
                  label="Engine Model"
                  type="text"
                  {...register("engineModel")}
                />

                <Input
                  label="Engine Serial"
                  type="text"
                  {...register("engineSerial")}
                />

                <Input
                  label="Total Engine Hours"
                  type="number"
                  placeholder="200"
                  maxLength={10}
                  step="0.1"
                  min="0"
                  onKeyPress={(e) => {
                    // Only allow numbers and decimal point
                    if (!/[0-9.]/.test(e.key)) {
                      e.preventDefault();
                    }
                  }}
                  {...register("totalEngineHours", {
                    pattern: {
                      value: /^\d+(\.\d+)?$/,
                      message: "Must be a valid number (decimals allowed)"
                    },
                    onChange: (e) => {
                      // Remove any non-numeric characters except decimal point
                      let value = e.target.value.replace(/[^0-9.]/g, '');
                      // Prevent multiple decimal points
                      const parts = value.split('.');
                      if (parts.length > 2) {
                        value = parts[0] + '.' + parts.slice(1).join('');
                      }
                      e.target.value = value;
                    }
                  })}
                  error={errors.totalEngineHours?.message}
                />

                <Input
                  label="Total Hours Since Service"
                  type="number"
                  placeholder="102"
                  maxLength={10}
                  step="0.1"
                  min="0"
                  onKeyPress={(e) => {
                    // Only allow numbers and decimal point
                    if (!/[0-9.]/.test(e.key)) {
                      e.preventDefault();
                    }
                  }}
                  {...register("totalHoursSinceService", {
                    pattern: {
                      value: /^\d+(\.\d+)?$/,
                      message: "Must be a valid number (decimals allowed)"
                    },
                    onChange: (e) => {
                      // Remove any non-numeric characters except decimal point
                      let value = e.target.value.replace(/[^0-9.]/g, '');
                      // Prevent multiple decimal points
                      const parts = value.split('.');
                      if (parts.length > 2) {
                        value = parts[0] + '.' + parts.slice(1).join('');
                      }
                      e.target.value = value;
                    }
                  })}
                  error={errors.totalHoursSinceService?.message}
                />
              </div>
            </div>
          </div>

          {/* Propeller Details Section */}
          <div className="bg-white rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-8 border-b-2 border-gray-300 pb-4">
              Propeller Details (As applicable to defect report)
            </h2>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Propeller Make"
                  type="text"
                  {...register("propellerMake")}
                />

                <Input
                  label="Propeller Model"
                  type="text"
                  {...register("propellerModel")}
                />

                <Input
                  label="Propeller Serial"
                  type="text"
                  {...register("propellerSerial")}
                />
              </div>
            </div>
          </div>

          {/* Attachments Section */}
          <div className="bg-white rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-8 border-b-2 border-gray-300 pb-4">
              Attachments
            </h2>

            <FileUpload
              label="Upload"
              description="Upload photos and videos as evidence. Additionally include engine, propeller and airframe maintenance inspection documentation from logbooks as it pertains to the report."
              multiple
              onChange={setAttachments}
              maxFiles={25}
              maxSize={256}
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-between px-6 pb-8">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (confirm('Are you sure you want to clear all form data?')) {
                  clearAllFormData();
                }
              }}
              className="bg-red-50 text-red-600 border-red-200 hover:bg-red-100 px-6 py-2"
            >
              Clear All
            </Button>
            <div className="flex space-x-4">
              <Button type="button" variant="outline" onClick={() => (window.location.href = "/")}>
                Cancel
              </Button>
              <Button type="submit">
                Review & Submit
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
