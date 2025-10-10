"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { PhoneInput } from "@/components/ui/PhoneInput";
import { DatePicker } from "@/components/ui/DatePicker";
import { Textarea } from "@/components/ui/Textarea";
import { Checkbox } from "@/components/ui/Checkbox";
import { Button } from "@/components/ui/Button";
import { FileUpload } from "@/components/ui/FileUpload";
import { AccidentFormData } from "@/types/forms";
import { validationPatterns, validationMessages, validateEmail, validatePhoneNumber, getPhoneValidationMessage } from "@/lib/validations/patterns";
import { useFormPersistence, useSpecialStatePersistence, clearFormOnSubmission } from "@/lib/utils/formPersistence";
import axios from "axios";
import Link from "next/link";
import "./wizard.css";

// Registration prefix options
const registrationPrefixOptions = [
  { value: "", label: "--" },
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

// Registration status options
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

// Aircraft type options
const aircraftTypeOptions = [
  { value: "", label: "- Please select -" },
  { value: "Three Axis Aeroplane", label: "Three Axis Aeroplane" },
  { value: "Weight-Shift Controlled Aeroplane", label: "Weight-Shift Controlled Aeroplane" },
  { value: "Powered Parachute", label: "Powered Parachute" },
];

// Year built options
const yearBuiltOptions = Array.from({ length: 91 }, (_, i) => {
  const year = 1935 + i;
  return { value: year.toString(), label: year.toString() };
});

// PLB options
const plbOptions = [
  { value: "", label: "-None-" },
  { value: "Yes", label: "Yes" },
  { value: "No", label: "No" },
];

const roleOptions = [
  { value: "", label: "- Please Select -" },
  { value: "Pilot in Command", label: "Pilot in Command" },
  { value: "Owner", label: "Owner" },
  { value: "L1", label: "L1" },
  { value: "L2", label: "L2" },
  { value: "LAME", label: "LAME" },
  { value: "Maintenance Personnel", label: "Maintenance Personnel" },
  { value: "Witness", label: "Witness" },
  { value: "Other", label: "Other" },
];

const stateOptions = [
  { value: "ACT", label: "ACT" },
  { value: "NSW", label: "NSW" },
  { value: "NT", label: "NT" },
  { value: "QLD", label: "QLD" },
  { value: "SA", label: "SA" },
  { value: "TAS", label: "TAS" },
  { value: "VIC", label: "VIC" },
  { value: "WA", label: "WA" },
];

const damageOptions = [
  { value: "", label: "– Please select –" },
  { value: "Destroyed", label: "Destroyed" },
  { value: "Minor", label: "Minor" },
  { value: "Nil", label: "Nil" },
  { value: "Unknown", label: "Unknown" },
];

const injuryOptions = [
  { value: "", label: "– Please select –" },
  { value: "Fatal", label: "Fatal" },
  { value: "Serious", label: "Serious" },
  { value: "Minor", label: "Minor" },
  { value: "Nil", label: "Nil" },
  { value: "Unknown", label: "Unknown" },
];

const maintainerLevelOptions = [
  { value: "", label: "– Please select –" },
  { value: "Level 1 Maintainer (L1)", label: "Level 1 Maintainer (L1)" },
  { value: "Level 2 Maintainer (L2)", label: "Level 2 Maintainer (L2)" },
  { value: "Level 4 Maintainer (L4)", label: "Level 4 Maintainer (L4)" },
];

const typeOfOperationOptions = [
  { value: "", label: "– Please Select –" },
  { value: "Flying Training – Dual", label: "Flying Training – Dual" },
  { value: "Flying Training – Solo", label: "Flying Training – Solo" },
  { value: "Private/Business", label: "Private/Business" },
  { value: "Sports Aviation", label: "Sports Aviation" },
];

const flightTrainingSchoolOptions = [
  { value: "Adelaide Biplanes", label: "Adelaide Biplanes" },
  { value: "Adelaide Biplanes - Weightshift (Group B)", label: "Adelaide Biplanes - Weightshift (Group B)" },
  { value: "Other", label: "Other" },
  // Add more options as needed
];

const phaseOfFlightOptions = [
  { value: "Not Answered", label: "Not Answered" },
  { value: "Standing", label: "Standing" },
  { value: "Taxiing", label: "Taxiing" },
  { value: "Takeoff", label: "Takeoff" },
  { value: "Initial Climb", label: "Initial Climb" },
  { value: "Cruise", label: "Cruise" },
  { value: "Manoeuvring/airwork", label: "Manoeuvring/airwork" },
  { value: "Descent", label: "Descent" },
  { value: "Approach", label: "Approach" },
  { value: "Landing", label: "Landing" },
  { value: "Unknown", label: "Unknown" },
];

const effectOfFlightOptions = [
  { value: "No Effect", label: "No Effect" },
  { value: "Rejected Take-off", label: "Rejected Take-off" },
  { value: "Precautionary Landing", label: "Precautionary Landing" },
  { value: "Engines Shut Down", label: "Engines Shut Down" },
  { value: "Unknown", label: "Unknown" },
];

const flightRulesOptions = [
  { value: "Not Answered", label: "Not Answered" },
  { value: "VFR", label: "VFR" },
  { value: "IFR", label: "IFR" },
  { value: "Unknown", label: "Unknown" },
];

const airspaceClassOptions = [
  { value: "Not Answered", label: "Not Answered" },
  { value: "A", label: "A" },
  { value: "C", label: "C" },
  { value: "D", label: "D" },
  { value: "E", label: "E" },
  { value: "G", label: "G" },
  { value: "Unknown", label: "Unknown" },
];

const airspaceTypeOptions = [
  { value: "Not Answered", label: "Not Answered" },
  { value: "CTA", label: "CTA" },
  { value: "CTR", label: "CTR" },
  { value: "CAF", label: "CAF" },
  { value: "OCTA", label: "OCTA" },
  { value: "PRD", label: "PRD" },
  { value: "OCA", label: "OCA" },
];

const altitudeTypeOptions = [
  { value: "Not answered", label: "Not answered" },
  { value: "AMSL (Above mean sea level)", label: "AMSL (Above mean sea level)" },
  { value: "AGL (Above ground level)", label: "AGL (Above ground level)" },
  { value: "Surface", label: "Surface" },
  { value: "Unknown", label: "Unknown" },
];

const lightConditionsOptions = [
  { value: "Not answered", label: "Not answered" },
  { value: "Dawn", label: "Dawn" },
  { value: "Daylight", label: "Daylight" },
  { value: "Dusk", label: "Dusk" },
  { value: "Night", label: "Night" },
  { value: "Unknown", label: "Unknown" },
];

const windDirectionOptions = [
  { value: "", label: "- Please Select -" },
  { value: "N", label: "N" },
  { value: "NE", label: "NE" },
  { value: "E", label: "E" },
  { value: "SE", label: "SE" },
  { value: "S", label: "S" },
  { value: "SW", label: "SW" },
  { value: "W", label: "W" },
  { value: "NW", label: "NW" },
];

const visibilityReducedByOptions = [
  { value: "Cloud", label: "Cloud" },
  { value: "Fog", label: "Fog" },
  { value: "Smoke", label: "Smoke" },
  { value: "Haze", label: "Haze" },
  { value: "unknown", label: "unknown" },
];

const windGustingOptions = [
  { value: "-None-", label: "-None-" },
  { value: "Not sure", label: "Not sure" },
  { value: "Yes", label: "Yes" },
  { value: "No", label: "No" },
];

const yesNoOptions = [
  { value: "Yes", label: "Yes" },
  { value: "No", label: "No" },
];

const strikeTypeOptions = [
  { value: "Not answered", label: "Not answered" },
  { value: "Bird", label: "Bird" },
  { value: "Animal", label: "Animal" },
  { value: "Unknown", label: "Unknown" },
];

const sizeOptions = [
  { value: "Not answered", label: "Not answered" },
  { value: "Small", label: "Small" },
  { value: "Medium", label: "Medium" },
  { value: "Large", label: "Large" },
  { value: "Unknown", label: "Unknown" },
];

const numberOptions = [
  { value: "Not answered", label: "Not answered" },
  { value: "1", label: "1" },
  { value: "2-10", label: "2-10" },
  { value: ">10", label: ">10" },
  { value: "Unknown", label: "Unknown" },
];

const proximityUnitOptions = [
  { value: "None", label: "None" },
  { value: "Metres (m)", label: "Metres (m)" },
  { value: "Nautical Miles (nm)", label: "Nautical Miles (nm)" },
  { value: "Minutes", label: "Minutes" },
];

const verticalProximityUnitOptions = [
  { value: "None", label: "None" },
  { value: "Feet (ft)", label: "Feet (ft)" },
  { value: "Metres (m)", label: "Metres (m)" },
];

const relativeTrackOptions = [
  { value: "None", label: "None" },
  { value: "Converging", label: "Converging" },
  { value: "Crossing", label: "Crossing" },
  { value: "Diverging", label: "Diverging" },
  { value: "Reciprocal", label: "Reciprocal" },
  { value: "Same Track", label: "Same Track" },
  { value: "Other", label: "Other" },
  { value: "Unknown", label: "Unknown" },
];

const avoidanceManoeuvreOptions = [
  { value: "Yes", label: "Yes" },
  { value: "No", label: "No" },
  { value: "Unknown", label: "Unknown" },
];

const alertReceivedOptions = [
  { value: "ATC Verbal", label: "ATC Verbal" },
  { value: "TCAS RA", label: "TCAS RA" },
  { value: "TCAS TA", label: "TCAS TA" },
  { value: "Other", label: "Other" },
  { value: "None", label: "None" },
  { value: "Unknown", label: "Unknown" },
];

export default function AccidentForm() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submissionData, setSubmissionData] = useState<any>(null);

  // Helper function to convert text to Title Case (First Letter Capital)
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
  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);

  // Person Reporting validation states
  const [memberValidationStatus, setMemberValidationStatus] = useState<"valid" | "invalid" | "">("");
  const [memberValidationMessage, setMemberValidationMessage] = useState("");
  const [isValidatingMember, setIsValidatingMember] = useState(false);

  // Pilot in Command validation states
  const [pilotValidationStatus, setPilotValidationStatus] = useState<"valid" | "invalid" | "">("");
  const [pilotValidationMessage, setPilotValidationMessage] = useState("");
  const [isValidatingPilot, setIsValidatingPilot] = useState(false);

  const [contactPhone, setContactPhone] = useState("");
  const [contactPhoneError, setContactPhoneError] = useState("");
  const [contactPhoneCountry, setContactPhoneCountry] = useState<"AU" | "CA" | "GB" | "US">("AU");
  const [pilotContactPhone, setPilotContactPhone] = useState("");
  const [pilotContactPhoneError, setPilotContactPhoneError] = useState("");
  const [pilotContactPhoneCountry, setPilotContactPhoneCountry] = useState<"AU" | "CA" | "GB" | "US">("AU");
  const [occurrenceDate, setOccurrenceDate] = useState("");
  const [occurrenceDateError, setOccurrenceDateError] = useState("");
  const [occurrenceTime, setOccurrenceTime] = useState("");
  const [occurrenceTimeError, setOccurrenceTimeError] = useState("");
  const [didInvolveBirdAnimalStrike, setDidInvolveBirdAnimalStrike] = useState(false);
  const [didInvolveNearMiss, setDidInvolveNearMiss] = useState(false);
  const [attachments, setAttachments] = useState<FileList | null>(null);

  // Aircraft lookup states
  const [isLookingUpAircraft, setIsLookingUpAircraft] = useState(false);
  const [aircraftLookupStatus, setAircraftLookupStatus] = useState<"success" | "error" | "">("");
  const [aircraftLookupMessage, setAircraftLookupMessage] = useState("");

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    trigger,
    reset,
    formState: { errors },
  } = useForm<AccidentFormData>();

  // Form persistence for current step
  const { clearCurrentForm } = useFormPersistence(
    { formType: 'accident', stepIndex: currentStep, maxSteps: 3 }, 
    watch, 
    setValue, 
    reset
  );

  // Special state persistence for current step
  const { clearSpecialState } = useSpecialStatePersistence(
    'accident',
    currentStep,
    {
      occurrenceDate,
      occurrenceTime,
      contactPhone,
      pilotContactPhone,
      contactPhoneCountry,
      pilotContactPhoneCountry,
      didInvolveBirdAnimalStrike,
      didInvolveNearMiss
    },
    {
      occurrenceDate: setOccurrenceDate,
      occurrenceTime: setOccurrenceTime,
      contactPhone: setContactPhone,
      pilotContactPhone: setPilotContactPhone,
      contactPhoneCountry: setContactPhoneCountry,
      pilotContactPhoneCountry: setPilotContactPhoneCountry,
      didInvolveBirdAnimalStrike: setDidInvolveBirdAnimalStrike,
      didInvolveNearMiss: setDidInvolveNearMiss
    }
  );



  // Watch the role field to conditionally show/hide Pilot in Command section
  const selectedRole = watch("role");
  
  // Watch the type of operation field to conditionally show flight training school
  const selectedTypeOfOperation = watch("Type_of_operation");
  
  // Watch registration fields for aircraft lookup
  const registrationPrefix = watch("Registration_number");
  const registrationSuffix = watch("Serial_number1");

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
    }
  }, [registrationPrefix, registrationSuffix]);

  // Validate member number (Person Reporting) with immediate feedback
  const validateMember = async (memberNumber: string, firstName: string, lastName: string) => {
    // Reset validation if any field is empty
    if (!memberNumber || !firstName || !lastName) {
      setMemberValidationStatus("");
      setMemberValidationMessage("");
      return;
    }

    setIsValidatingMember(true);

    try {
      const response = await axios.post("/api/validate-member", {
        memberNumber,
        firstName,
        lastName,
      });

      if (response.data.valid) {
        setMemberValidationStatus("valid");
        setMemberValidationMessage("✓ Member Number exists in system");
      } else {
        setMemberValidationStatus("invalid");
        setMemberValidationMessage(response.data.warning || "Member Number not found");
      }
    } catch (error) {
      setMemberValidationStatus("invalid");
      setMemberValidationMessage("Unable to validate Member Number");
    } finally {
      setIsValidatingMember(false);
    }
  };

  // Validate pilot member number (Pilot in Command) with immediate feedback
  const validatePilot = async (memberNumber: string, firstName: string, lastName: string) => {
    // Reset validation if any field is empty
    if (!memberNumber || !firstName || !lastName) {
      setPilotValidationStatus("");
      setPilotValidationMessage("");
      return;
    }

    setIsValidatingPilot(true);

    try {
      const response = await axios.post("/api/validate-member", {
        memberNumber,
        firstName,
        lastName,
      });

      if (response.data.valid) {
        setPilotValidationStatus("valid");
        setPilotValidationMessage("✓ Member Number exists in system");
      } else {
        setPilotValidationStatus("invalid");
        setPilotValidationMessage(response.data.warning || "Member Number not found");
      }
    } catch (error) {
      setPilotValidationStatus("invalid");
      setPilotValidationMessage("Unable to validate Member Number");
    } finally {
      setIsValidatingPilot(false);
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
        signal, // Pass the AbortSignal to axios
      });

      if (response?.data?.success && response?.data?.data) {
        const aircraftData = response.data.data;
        
        // Auto-fill aircraft fields
        setValue("Serial_number", aircraftData.Serial_Number1 || "");
        setValue("Make1", aircraftData.Manufacturer || "");
        setValue("Model", aircraftData.Model || "");
        setValue("Registration_status", aircraftData.Registration_Type || "");
        setValue("Type1", aircraftData.Type || "");
        setValue("Year_Built1", aircraftData.Year_Built1 || aircraftData.Manufacturer_Date || "");
        
        // Auto-fill engine fields
        setValue("Engine_Details", aircraftData.Engine_Details || "");
        setValue("Engine_model", aircraftData.Engine_model || "");
        setValue("Engine_serial", aircraftData.Engines_Serial || "");
        
        // Auto-fill propeller fields
        setValue("Propeller_make", aircraftData.Propeller_make || "");
        setValue("Propeller_model", aircraftData.Propeller_model || "");
        setValue("Propeller_serial", aircraftData.Propeller_serial || "");

        let fieldsPopulated = 0;
        const aircraftFields = ["Serial_number", "Make1", "Model", "Registration_status", "Type1", "Year_Built1"];
        const engineFields = ["Engine_Details", "Engine_model", "Engine_serial"];
        const propellerFields = ["Propeller_make", "Propeller_model", "Propeller_serial"];
        
        aircraftFields.forEach(field => aircraftData[field.replace("1", "_Number1")] && fieldsPopulated++);
        engineFields.forEach(field => aircraftData[field] && fieldsPopulated++);
        propellerFields.forEach(field => aircraftData[field] && fieldsPopulated++);

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
      // Don't show error if request was aborted (user changed fields)
      if (axios.isCancel(error) || error.name === 'CanceledError' || error.code === 'ERR_CANCELED') {
        return;
      }
      
      setAircraftLookupStatus("error");
      setAircraftLookupMessage("Unable to lookup aircraft data. Please try again.");
      console.error("Aircraft lookup error:", error);
    } finally {
      setIsLookingUpAircraft(false);
    }
  };

  const nextStep = async () => {
    // Clear previous errors
    setContactPhoneError("");
    setPilotContactPhoneError("");
    setOccurrenceDateError("");
    setOccurrenceTimeError("");
    
    // Trigger form validation to show inline error messages
    let fieldsToValidate: string[] = [];
    let hasError = false;

    if (currentStep === 1) {
      // Step 1: Pilot Information validation
      fieldsToValidate = [
        "role",
        "firstName", 
        "lastName",
        "emailAddress"
      ];
      
      // Validate contact phone with country-specific rules
      if (!contactPhone || contactPhone.trim() === "") {
        setContactPhoneError("Contact Phone is required");
        hasError = true;
      } else if (!validatePhoneNumber(contactPhone, contactPhoneCountry)) {
        setContactPhoneError(getPhoneValidationMessage(contactPhoneCountry));
        hasError = true;
      }

      // Validate Pilot in Command contact phone (if section is visible)
      if (selectedRole !== "Pilot in Command") {
        if (pilotContactPhone && pilotContactPhone.trim() !== "") {
          if (!validatePhoneNumber(pilotContactPhone, pilotContactPhoneCountry)) {
            setPilotContactPhoneError(getPhoneValidationMessage(pilotContactPhoneCountry));
            hasError = true;
          }
        }
      }
    } else if (currentStep === 2) {
      // Step 2: Occurrence Information validation
      fieldsToValidate = [
        "state",
        "location",
        "detailsOfIncident",
        "Damage_to_aircraft",
        "Most_serious_injury_to_pilot",
        "Description_of_damage_to_aircraft",
        "Accident_or_Incident",
        "Details_of_incident_accident",
        "Reporter_Suggestions",
        "ATSB_reportable_status",
        "Type_of_operation",
        "Wind_gusting",
        "Personal_Locator_Beacon_carried"
      ];
      
      // Check date and time separately since they're not in the form
      if (!occurrenceDate || occurrenceDate.trim() === "") {
        setOccurrenceDateError("Occurrence Date is required");
        hasError = true;
      }
      if (!occurrenceTime || occurrenceTime.trim() === "") {
        setOccurrenceTimeError("Occurrence Time is required");
        hasError = true;
      }
    }

    // Trigger validation for all fields in the current step
    const result = await trigger(fieldsToValidate as any);
    
    if (!result || hasError) {
      // Validation failed, errors are now displayed inline under each field
      // Scroll to the first error
      setTimeout(() => {
        const firstError = document.querySelector('.text-red-500, .text-red-600, .border-red-500');
        if (firstError) {
          firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
      return;
    }

    // If validation passes, move to next step
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
      // Scroll to top of page when moving to next step
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      // Scroll to top of page when moving to previous step
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const onSubmit = async (data: AccidentFormData) => {
    setIsSubmitting(true);

    try {
      // Validate required fields
      if (!occurrenceDate || !occurrenceTime) {
        alert("Please provide both occurrence date and time");
        setIsSubmitting(false);
        return;
      }

      if (!contactPhone) {
        alert("Please provide a contact phone number");
        setIsSubmitting(false);
        return;
      }

      // Convert date and time to ISO format
      const datetime = new Date(`${occurrenceDate}T${occurrenceTime}`);
      if (isNaN(datetime.getTime())) {
        alert("Invalid date or time provided");
        setIsSubmitting(false);
        return;
      }

      // Prepare form data for unified API
      const formData = new FormData();
      
      // Add form type and data
      formData.append('formType', 'accident');
      
      // Convert "Yes"/"No" strings to boolean for Zoho CRM compatibility
      const submissionData = {
        ...data,
        contactPhone: contactPhone,
        pilotContactPhone: pilotContactPhone,
        occurrenceDate: datetime.toISOString().slice(0, 19), // YYYY-MM-DDTHH:mm:ss format
        // Convert Yes/No strings to boolean
        Involve_IFR_or_Air_Transport_Operations: data.Involve_IFR_or_Air_Transport_Operations === "Yes" ? true : data.Involve_IFR_or_Air_Transport_Operations === "No" ? false : data.Involve_IFR_or_Air_Transport_Operations,
        In_controlled_or_special_use_airspace: data.In_controlled_or_special_use_airspace === "Yes" ? true : data.In_controlled_or_special_use_airspace === "No" ? false : data.In_controlled_or_special_use_airspace,
        Involve_near_miss_with_another_aircraft: typeof data.Involve_near_miss_with_another_aircraft === 'boolean' ? data.Involve_near_miss_with_another_aircraft : data.Involve_near_miss_with_another_aircraft === "Yes" ? true : data.Involve_near_miss_with_another_aircraft === "No" ? false : data.Involve_near_miss_with_another_aircraft,
        Bird_or_Animal_Strike: typeof data.Bird_or_Animal_Strike === 'boolean' ? data.Bird_or_Animal_Strike : data.Bird_or_Animal_Strike === "Yes" ? true : data.Bird_or_Animal_Strike === "No" ? false : data.Bird_or_Animal_Strike,
      };
      
      formData.append('formData', JSON.stringify(submissionData));

      // Add attachments if any
      if (attachments && attachments.length > 0) {
        Array.from(attachments).forEach((file, index) => {
          formData.append(`file_${index}`, file);
        });
      }

      // Submit to unified API endpoint
      const response = await axios.post("/api/submit-form", formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        setSubmissionData(response.data);
        clearFormOnSubmission('accident', 3);
        setSubmitSuccess(true);
      } else {
        throw new Error(response.data.error || "Failed to process accident report");
      }
    } catch (error: any) {
      let errorMessage = "Failed to submit form. Please try again.";
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.data?.data?.[0]?.message) {
        errorMessage = error.response.data.data[0].message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      alert(`Submission Error: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const downloadPDF = async () => {
    if (!submissionData) return;

    setIsDownloadingPDF(true);
    try {
      const response = await axios.post(
        "/api/generate-pdf",
        {
          formType: "accident",
          formData: submissionData.formData,
          metadata: submissionData.metadata,
        },
        {
          responseType: "blob",
        }
      );

      // Create a download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `Accident_Report_${submissionData.metadata?.occurrenceId || 'submission'}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading PDF:", error);
      alert("Failed to download PDF. Please try again.");
    } finally {
      setIsDownloadingPDF(false);
    }
  };

  if (submitSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Accident/Incident Report Submitted</h2>
          <p className="text-gray-600 mb-4">
            Your accident/incident report has been successfully submitted to RAAus. You will receive a confirmation email shortly.
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
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Home Button */}
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Home
          </Link>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Lodge a New Accident or Incident</h1>
          <div className="w-full h-px bg-gray-300"></div>
        </div>

        {/* Clear Form Button */}
        <div className="mb-6 flex justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              clearCurrentForm();
              clearSpecialState();
              // Clear file attachments
              setAttachments(null);
            }}
            className="bg-red-50 text-red-600 border-red-200 hover:bg-red-100"
          >
            Clear Current Step
          </Button>
        </div>

        {/* Wizard Navigation */}
        <div className="bg-white rounded-lg shadow-lg mb-8 overflow-hidden">
          <div className="wizard-container">
            <div className="wizard-upper-tab">
              <div 
                className={`page-nav ${currentStep === 1 ? 'active' : ''} ${currentStep > 1 ? 'completed' : ''} clickable`}
                onClick={() => setCurrentStep(1)}
              >
                <span className="step-number">1</span>
                <span className="step-title">Pilot Information</span>
              </div>
              <div 
                className={`page-nav ${currentStep === 2 ? 'active' : ''} ${currentStep > 2 ? 'completed' : ''} ${currentStep >= 2 ? 'clickable' : ''}`}
                onClick={() => currentStep >= 2 && setCurrentStep(2)}
              >
                <span className="step-number">2</span>
                <span className="step-title">Occurrence Information</span>
              </div>
              <div 
                className={`page-nav ${currentStep === 3 ? 'active' : ''} ${currentStep >= 3 ? 'clickable' : ''}`}
                onClick={() => currentStep >= 3 && setCurrentStep(3)}
              >
                <span className="step-number">3</span>
                <span className="step-title">Aircraft Information</span>
              </div>
            </div>
            <div className="wizard-lower-tab">
              <div className={`tab-arrow ${currentStep === 1 ? 'active' : ''}`}></div>
              <div className={`tab-arrow ${currentStep === 2 ? 'active' : ''}`}></div>
              <div className={`tab-arrow ${currentStep === 3 ? 'active' : ''}`}></div>
            </div>
          </div>
        </div>

        {/* Form Content */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <form onSubmit={handleSubmit(onSubmit)}>
            {currentStep === 1 && (
              <div className="space-y-8">
                {/* Person Reporting Section */}
                <div className="border-b border-gray-200 pb-8">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Person Reporting</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Select
                      label="Role"
                      required
                      options={roleOptions}
                      error={errors.role?.message}
                      {...register("role", { 
                        required: "This field cannot be blank." 
                      })}
                    />

                    <div>
                      <Input
                        label="Member Number"
                        type="text"
                        placeholder="123456"
                        maxLength={6}
                        error={errors.memberNumber?.message}
                        onKeyPress={(e) => {
                          // Only allow numbers (0-9)
                          if (!/[0-9]/.test(e.key)) {
                            e.preventDefault();
                          }
                        }}
                        {...register("memberNumber", {
                          pattern: {
                            value: validationPatterns.memberNumber,
                            message: validationMessages.memberNumber,
                          },
                          minLength: {
                            value: 6,
                            message: validationMessages.memberNumber,
                          },
                          onChange: (e) => {
                            // Remove any non-numeric characters
                            e.target.value = e.target.value.replace(/[^0-9]/g, '');
                            const memberNumber = e.target.value;
                            const firstName = watch("firstName");
                            const lastName = watch("lastName");
                            if (memberNumber && firstName && lastName) {
                              validateMember(memberNumber, firstName, lastName);
                            } else {
                              setMemberValidationStatus("");
                              setMemberValidationMessage("");
                            }
                          }
                        })}
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
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    <Input
                      label="First Name"
                      required
                      placeholder="John"
                      maxLength={30}
                      error={errors.firstName?.message}
                      onKeyPress={(e) => {
                        // Only allow letters (a-z, A-Z) and spaces
                        if (!/[a-zA-Z ]/.test(e.key)) {
                          e.preventDefault();
                        }
                      }}
                      {...register("firstName", {
                        required: "This field cannot be blank.",
                        pattern: {
                          value: validationPatterns.name,
                          message: validationMessages.name
                        },
                        minLength: {
                          value: 3,
                          message: validationMessages.name
                        },
                        maxLength: {
                          value: 30,
                          message: validationMessages.name
                        },
                        onChange: (e) => {
                          // Remove any non-letter/space characters
                          let value = e.target.value.replace(/[^a-zA-Z ]/g, '');
                          // Convert to Title Case
                          value = toTitleCase(value);
                          e.target.value = value;
                          
                          const firstName = value;
                          const memberNumber = watch("memberNumber");
                          const lastName = watch("lastName");
                          if (memberNumber && firstName && lastName) {
                            validateMember(memberNumber, firstName, lastName);
                          }
                        }
                      })}
                    />

                    <Input
                      label="Last Name"
                      required
                      placeholder="Doe"
                      maxLength={30}
                      error={errors.lastName?.message}
                      onKeyPress={(e) => {
                        // Only allow letters (a-z, A-Z) and spaces
                        if (!/[a-zA-Z ]/.test(e.key)) {
                          e.preventDefault();
                        }
                      }}
                      {...register("lastName", {
                        required: "This field cannot be blank.",
                        pattern: {
                          value: validationPatterns.name,
                          message: validationMessages.name
                        },
                        minLength: {
                          value: 3,
                          message: validationMessages.name
                        },
                        maxLength: {
                          value: 30,
                          message: validationMessages.name
                        },
                        onChange: (e) => {
                          // Remove any non-letter/space characters
                          let value = e.target.value.replace(/[^a-zA-Z ]/g, '');
                          // Convert to Title Case
                          value = toTitleCase(value);
                          e.target.value = value;
                          
                          const lastName = value;
                          const memberNumber = watch("memberNumber");
                          const firstName = watch("firstName");
                          if (memberNumber && firstName && lastName) {
                            validateMember(memberNumber, firstName, lastName);
                          }
                        }
                      })}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    <Input
                      label="Email Address"
                      type="email"
                      placeholder="example@domain.com"
                      required
                      error={errors.emailAddress?.message}
                      {...register("emailAddress", {
                        required: "Email address is required",
                        validate: (value) => !value || validateEmail(value) || "Please enter a valid email address (e.g., user@example.com)"
                      })}
                    />

                    <PhoneInput
                      label="Contact Phone"
                      required
                      placeholder="0412 345 678"
                      value={contactPhone}
                      onChange={(value) => {
                        setContactPhone(value);
                        if (value && value.trim() !== "") {
                          setContactPhoneError("");
                        }
                      }}
                      onCountryChange={(country) => setContactPhoneCountry(country)}
                      defaultCountry="AU"
                      countries={["AU", "CA", "GB"]}
                      error={contactPhoneError}
                      validateOnBlur={true}
                    />
                  </div>
                </div>

                {/* Pilot in Command Section - Hidden when Person Reporting role is "Pilot in Command" */}
                {selectedRole !== "Pilot in Command" && (
                  <div className="border-b border-gray-200 pb-8">
                    <h2 className="text-xl font-semibold text-gray-900 mb-6">Pilot in Command</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Input
                          label="Member Number"
                          type="text"
                          placeholder="123456"
                          maxLength={6}
                          helpText="Must be exactly 6 digits. If the pilot was not a member, leave blank."
                          error={errors.PIC_Member_Number?.message}
                          onKeyPress={(e) => {
                            // Only allow numbers (0-9)
                            if (!/[0-9]/.test(e.key)) {
                              e.preventDefault();
                            }
                          }}
                          {...register("PIC_Member_Number", {
                            pattern: {
                              value: validationPatterns.memberNumber,
                              message: validationMessages.memberNumber,
                            },
                            minLength: {
                              value: 6,
                              message: validationMessages.memberNumber,
                            },
                            onChange: (e) => {
                              // Remove any non-numeric characters
                              e.target.value = e.target.value.replace(/[^0-9]/g, '');
                              const memberNumber = e.target.value;
                              const firstName = watch("PIC_Name");
                              const lastName = watch("PIC_Last_Name");
                              if (memberNumber && firstName && lastName) {
                                validatePilot(memberNumber, firstName, lastName);
                              } else {
                                setPilotValidationStatus("");
                                setPilotValidationMessage("");
                              }
                            }
                          })}
                        />
                        {isValidatingPilot && (
                          <p className="text-sm text-gray-500 mt-1">Validating...</p>
                        )}
                        {!isValidatingPilot && pilotValidationStatus === "valid" && (
                          <p className="text-sm text-green-600 mt-1 font-medium">{pilotValidationMessage}</p>
                        )}
                        {!isValidatingPilot && pilotValidationStatus === "invalid" && (
                          <p className="text-sm text-red-600 mt-1">{pilotValidationMessage}</p>
                        )}
                      </div>

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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                      <Input
                        label="First Name"
                        placeholder="John"
                        maxLength={30}
                        error={errors.PIC_Name?.message}
                        onKeyPress={(e) => {
                          // Only allow letters (a-z, A-Z) and spaces
                          if (!/[a-zA-Z ]/.test(e.key)) {
                            e.preventDefault();
                          }
                        }}
                        {...register("PIC_Name", {
                          pattern: {
                            value: validationPatterns.name,
                            message: validationMessages.name,
                          },
                          minLength: {
                            value: 3,
                            message: validationMessages.name,
                          },
                          maxLength: {
                            value: 30,
                            message: validationMessages.name,
                          },
                          onChange: (e) => {
                            // Remove any non-letter/space characters
                            let value = e.target.value.replace(/[^a-zA-Z ]/g, '');
                            // Convert to Title Case
                            value = toTitleCase(value);
                            e.target.value = value;
                            
                            const firstName = value;
                            const memberNumber = watch("PIC_Member_Number");
                            const lastName = watch("PIC_Last_Name");
                            if (memberNumber && firstName && lastName) {
                              validatePilot(memberNumber, firstName, lastName);
                            }
                          }
                        })}
                      />

                      <Input
                        label="Last Name"
                        placeholder="Doe"
                        maxLength={30}
                        error={errors.PIC_Last_Name?.message}
                        onKeyPress={(e) => {
                          // Only allow letters (a-z, A-Z) and spaces
                          if (!/[a-zA-Z ]/.test(e.key)) {
                            e.preventDefault();
                          }
                        }}
                        {...register("PIC_Last_Name", {
                          pattern: {
                            value: validationPatterns.name,
                            message: validationMessages.name,
                          },
                          minLength: {
                            value: 3,
                            message: validationMessages.name,
                          },
                          maxLength: {
                            value: 30,
                            message: validationMessages.name,
                          },
                          onChange: (e) => {
                            // Remove any non-letter/space characters
                            let value = e.target.value.replace(/[^a-zA-Z ]/g, '');
                            // Convert to Title Case
                            value = toTitleCase(value);
                            e.target.value = value;
                            
                            const lastName = value;
                            const memberNumber = watch("PIC_Member_Number");
                            const firstName = watch("PIC_Name");
                            if (memberNumber && firstName && lastName) {
                              validatePilot(memberNumber, firstName, lastName);
                            }
                          }
                        })}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                      <PhoneInput
                        label="Contact Phone"
                        placeholder="0412 345 678"
                        value={pilotContactPhone}
                        onValueChange={(value) => {
                          setPilotContactPhone(value);
                          // Clear error when user starts typing
                          if (pilotContactPhoneError) {
                            setPilotContactPhoneError("");
                          }
                        }}
                        onCountryChange={(country) => setPilotContactPhoneCountry(country)}
                        defaultCountry="AU"
                        countries={["AU", "CA", "GB"]}
                        error={pilotContactPhoneError || errors.PIC_Contact_Phone?.message}
                        validateOnBlur={true}
                      />

                      <Input
                        label="Email"
                        type="email"
                        placeholder="example@domain.com"
                        error={errors.PIC_Email?.message}
                        {...register("PIC_Email", {
                          validate: (value) => !value || validateEmail(value) || "Please enter a valid email address (e.g., user@example.com)"
                        })}
                      />
                    </div>
                  </div>
                )}

                {/* Flying Hours Section */}
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Flying Hours</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input
                      label="Hours Last 90 Days"
                      type="text"
                      placeholder="45.2"
                      maxLength={10}
                      error={errors.Hours_last_90_days?.message}
                      onKeyPress={(e) => {
                        // Only allow numbers (0-9) and decimal point
                        if (!/[0-9.]/.test(e.key)) {
                          e.preventDefault();
                        }
                      }}
                      {...register("Hours_last_90_days", {
                        pattern: {
                          value: validationPatterns.decimalNumber,
                          message: validationMessages.decimalNumber,
                        },
                        onChange: (e) => {
                          // Remove any non-numeric characters except decimal point
                          // Allow only one decimal point
                          let value = e.target.value.replace(/[^0-9.]/g, '');
                          const parts = value.split('.');
                          if (parts.length > 2) {
                            value = parts[0] + '.' + parts.slice(1).join('');
                          }
                          e.target.value = value;
                        }
                      })}
                    />

                    <Input
                      label="Total Flying Hours"
                      type="text"
                      placeholder="5280.7"
                      maxLength={10}
                      error={errors.Total_flying_hours?.message}
                      onKeyPress={(e) => {
                        // Only allow numbers (0-9) and decimal point
                        if (!/[0-9.]/.test(e.key)) {
                          e.preventDefault();
                        }
                      }}
                      {...register("Total_flying_hours", {
                        pattern: {
                          value: validationPatterns.decimalNumber,
                          message: validationMessages.decimalNumber,
                        },
                        onChange: (e) => {
                          // Remove any non-numeric characters except decimal point
                          // Allow only one decimal point
                          let value = e.target.value.replace(/[^0-9.]/g, '');
                          const parts = value.split('.');
                          if (parts.length > 2) {
                            value = parts[0] + '.' + parts.slice(1).join('');
                          }
                          e.target.value = value;
                        }
                      })}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    <Input
                      label="Hours on Type"
                      type="text"
                      placeholder="850.3"
                      maxLength={10}
                      error={errors.Hours_on_type?.message}
                      onKeyPress={(e) => {
                        // Only allow numbers (0-9) and decimal point
                        if (!/[0-9.]/.test(e.key)) {
                          e.preventDefault();
                        }
                      }}
                      {...register("Hours_on_type", {
                        pattern: {
                          value: validationPatterns.decimalNumber,
                          message: validationMessages.decimalNumber,
                        },
                        onChange: (e) => {
                          // Remove any non-numeric characters except decimal point
                          // Allow only one decimal point
                          let value = e.target.value.replace(/[^0-9.]/g, '');
                          const parts = value.split('.');
                          if (parts.length > 2) {
                            value = parts[0] + '.' + parts.slice(1).join('');
                          }
                          e.target.value = value;
                        }
                      })}
                    />

                    <Input
                      label="Hours on Type Last 90 Days"
                      type="text"
                      placeholder="25.5"
                      maxLength={10}
                      error={errors.Hours_on_type_last_90_days?.message}
                      onKeyPress={(e) => {
                        // Only allow numbers (0-9) and decimal point
                        if (!/[0-9.]/.test(e.key)) {
                          e.preventDefault();
                        }
                      }}
                      {...register("Hours_on_type_last_90_days", {
                        pattern: {
                          value: validationPatterns.decimalNumber,
                          message: validationMessages.decimalNumber,
                        },
                        onChange: (e) => {
                          // Remove any non-numeric characters except decimal point
                          // Allow only one decimal point
                          let value = e.target.value.replace(/[^0-9.]/g, '');
                          const parts = value.split('.');
                          if (parts.length > 2) {
                            value = parts[0] + '.' + parts.slice(1).join('');
                          }
                          e.target.value = value;
                        }
                      })}
                    />
                  </div>
                </div>

                {/* Navigation Buttons */}
                <div className="flex justify-between pt-8 border-t border-gray-200">
                  <div></div>
                  <Button
                    type="button"
                    onClick={nextStep}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-2"
                  >
                    Next: Occurrence Information
                  </Button>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-8">
                {/* Occurrence Information Section */}
                <div className="border-b border-gray-200 pb-8">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Occurrence Information</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Occurrence Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={occurrenceDate}
                        onChange={(e) => {
                          const selectedDateStr = e.target.value;
                          const selectedDate = new Date(selectedDateStr + 'T00:00:00');
                          const today = new Date();
                          today.setHours(0, 0, 0, 0);
                          
                          // Only block if selected date is AFTER today
                          if (selectedDate.getTime() > today.getTime()) {
                            setOccurrenceDateError("Occurrence date cannot be in the future");
                            return;
                          }
                          
                          setOccurrenceDate(selectedDateStr);
                          if (selectedDateStr && selectedDateStr.trim() !== "") {
                            setOccurrenceDateError("");
                          }
                        }}
                        className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 ${
                          occurrenceDateError 
                            ? 'border-red-500 focus:ring-red-500' 
                            : 'border-gray-300 focus:ring-blue-500'
                        }`}
                        min="1900-01-01"
                        max={new Date().toISOString().split('T')[0]}
                        required
                      />
                      {occurrenceDateError && (
                        <p className="mt-1 text-sm text-red-600">
                          {occurrenceDateError}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Occurrence Time <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="time"
                        value={occurrenceTime}
                        onChange={(e) => {
                          const selectedTime = e.target.value;
                          
                          // If today's date is selected, validate time is in the past
                          if (occurrenceDate) {
                            const selectedDate = new Date(occurrenceDate);
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);
                            
                            // If occurrence date is today
                            if (selectedDate.getTime() === today.getTime()) {
                              const [hours, minutes] = selectedTime.split(':');
                              const currentHours = new Date().getHours();
                              const currentMinutes = new Date().getMinutes();
                              
                              if (parseInt(hours) > currentHours || 
                                  (parseInt(hours) === currentHours && parseInt(minutes) > currentMinutes)) {
                                setOccurrenceTimeError("Occurrence time must be in the past");
                                return;
                              }
                            }
                          }
                          
                          setOccurrenceTime(e.target.value);
                          if (e.target.value && e.target.value.trim() !== "") {
                            setOccurrenceTimeError("");
                          }
                        }}
                        className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 ${
                          occurrenceTimeError 
                            ? 'border-red-500 focus:ring-red-500' 
                            : 'border-gray-300 focus:ring-blue-500'
                        }`}
                        required
                      />
                      {occurrenceTimeError && (
                        <p className="mt-1 text-sm text-red-600">
                          {occurrenceTimeError}
                        </p>
                      )}
                    </div>

                    <Select
                      label="State"
                      required
                      options={stateOptions}
                      error={errors.state?.message}
                      {...register("state", { 
                        required: "This field cannot be blank." 
                      })}
                    />
                  </div>

                  <div className="mt-6">
                    <Textarea
                      label="Location"
                      required
                      placeholder="Enter location details"
                      rows={3}
                      maxLength={250}
                      error={errors.location?.message}
                      {...register("location", {
                        required: "This field cannot be blank.",
                        minLength: {
                          value: 4,
                          message: validationMessages.minLength
                        },
                        maxLength: {
                          value: 250,
                          message: validationMessages.minLength
                        }
                      })}
                    />
                  </div>

                  <div className="mt-6">
                    <Textarea
                      label="Details of Incident/Accident (Please give a clear and accurate description of what happened)"
                      required
                      rows={3}
                      maxLength={255}
                      error={errors.detailsOfIncident?.message}
                      {...register("detailsOfIncident", {
                        required: "This field cannot be blank.",
                        minLength: {
                          value: 4,
                          message: validationMessages.minLength
                        },
                        maxLength: {
                          value: 255,
                          message: validationMessages.minLength
                        }
                      })}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    <Select
                      label="Damage to Aircraft"
                      required
                      options={damageOptions}
                      error={errors.Damage_to_aircraft?.message}
                      {...register("Damage_to_aircraft", { 
                        required: "This field cannot be blank." 
                      })}
                    />

                    <Select
                      label="Most Serious Injury to Pilot"
                      required
                      options={injuryOptions}
                      error={errors.Most_serious_injury_to_pilot?.message}
                      {...register("Most_serious_injury_to_pilot", { 
                        required: "This field cannot be blank." 
                      })}
                    />
                  </div>

                  <div className="mt-6">
                    <Select
                      label="Did this occurrence involve an aircraft conducting IFR or air transport operations (airline/charter/cargo/medical)"
                      options={yesNoOptions}
                      error={errors.Involve_IFR_or_Air_Transport_Operations?.message}
                      {...register("Involve_IFR_or_Air_Transport_Operations")}
                    />
                  </div>

                  <div className="mt-6">
                    <Select
                      label="Did the occurrence take place in controlled airspace or special use airspace(military/danger/restricted/prohibited)?"
                      options={yesNoOptions}
                      error={errors.In_controlled_or_special_use_airspace?.message}
                      {...register("In_controlled_or_special_use_airspace")}
                    />
                  </div>

                  <div className="mt-6">
                    <Input
                      label="Passenger Details"
                      placeholder="Please supply names of other passengers if applicable"
                      maxLength={100}
                      error={errors.Passenger_details?.message}
                      {...register("Passenger_details", {
                        pattern: {
                          value: validationPatterns.alphanumericWithSpaces,
                          message: validationMessages.alphanumeric
                        }
                      })}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    <Select
                      label="Passenger Injury"
                      options={injuryOptions}
                      error={errors.Passenger_injury?.message}
                      {...register("Passenger_injury")}
                    />

                    <Select
                      label="Persons on the Ground Injury"
                      options={injuryOptions}
                      error={errors.Persons_on_the_ground_injury?.message}
                      {...register("Persons_on_the_ground_injury")}
                    />
                  </div>

                  <div className="mt-6">
                    <Textarea
                      label="Description of Damage to Aircraft"
                      required
                      rows={3}
                      maxLength={255}
                      error={errors.Description_of_damage_to_aircraft?.message}
                      {...register("Description_of_damage_to_aircraft", {
                        required: "This field cannot be blank.",
                        minLength: {
                          value: 4,
                          message: validationMessages.minLength
                        },
                        maxLength: {
                          value: 255,
                          message: validationMessages.minLength
                        }
                      })}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    <Input
                      label="Maintainer First Name"
                      placeholder="Robert"
                      maxLength={30}
                      error={errors.Maintainer_Name?.message}
                      onKeyPress={(e) => {
                        // Only allow letters (a-z, A-Z) and spaces
                        if (!/[a-zA-Z ]/.test(e.key)) {
                          e.preventDefault();
                        }
                      }}
                      {...register("Maintainer_Name", {
                        pattern: {
                          value: validationPatterns.name,
                          message: validationMessages.name
                        },
                        minLength: {
                          value: 3,
                          message: validationMessages.name
                        },
                        maxLength: {
                          value: 30,
                          message: validationMessages.name
                        },
                        onChange: (e) => {
                          // Remove any non-letter/space characters
                          let value = e.target.value.replace(/[^a-zA-Z ]/g, '');
                          // Convert to Title Case
                          value = toTitleCase(value);
                          e.target.value = value;
                        }
                      })}
                    />

                    <Input
                      label="Maintainer Member Number"
                      placeholder="e.g. 123456"
                      error={errors.Maintainer_Member_Number?.message}
                      onKeyPress={(e) => {
                        // Only allow numbers (0-9)
                        if (!/[0-9]/.test(e.key)) {
                          e.preventDefault();
                        }
                      }}
                      {...register("Maintainer_Member_Number", {
                        onChange: (e) => {
                          // Remove any non-numeric characters
                          e.target.value = e.target.value.replace(/[^0-9]/g, '');
                        }
                      })}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    <Input
                      label="Maintainer Last Name"
                      placeholder="Johnson"
                      maxLength={30}
                      error={errors.Maintainer_Last_Name?.message}
                      onKeyPress={(e) => {
                        // Only allow letters (a-z, A-Z) and spaces
                        if (!/[a-zA-Z ]/.test(e.key)) {
                          e.preventDefault();
                        }
                      }}
                      {...register("Maintainer_Last_Name", {
                        pattern: {
                          value: validationPatterns.name,
                          message: validationMessages.name
                        },
                        minLength: {
                          value: 3,
                          message: validationMessages.name
                        },
                        maxLength: {
                          value: 30,
                          message: validationMessages.name
                        },
                        onChange: (e) => {
                          // Remove any non-letter/space characters
                          let value = e.target.value.replace(/[^a-zA-Z ]/g, '');
                          // Convert to Title Case
                          value = toTitleCase(value);
                          e.target.value = value;
                        }
                      })}
                    />

                    <Select
                      label="Maintainer Level"
                      options={maintainerLevelOptions}
                      error={errors.Maintainer_Level?.message}
                      {...register("Maintainer_Level")}
                    />
                  </div>

                  <div className="mt-6">
                    <fieldset>
                      <legend className="text-sm font-medium text-gray-700 mb-3">
                        Is this Occurrence an Accident or an Incident? <span className="text-red-500">*</span>
                      </legend>
                      <div className="space-y-2">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            value="Accident"
                            {...register("Accident_or_Incident", { required: "This field cannot be blank." })}
                            className="mr-2"
                          />
                          Accident
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            value="Incident"
                            {...register("Accident_or_Incident", { required: "This field cannot be blank." })}
                            className="mr-2"
                          />
                          Incident
                        </label>
                      </div>
                      {errors.Accident_or_Incident && (
                        <p className="text-red-500 text-sm mt-1">{errors.Accident_or_Incident.message}</p>
                      )}
                    </fieldset>
                  </div>

                  <div className="mt-6">
                    <Textarea
                      label="What may have contributed to the event?"
                      required
                      rows={3}
                      error={errors.Details_of_incident_accident?.message}
                      {...register("Details_of_incident_accident", {
                        required: "This field cannot be blank."
                      })}
                    />
                  </div>

                  <div className="mt-6">
                    <Textarea
                      label="Do you have further suggestions on how to prevent similar occurrences?"
                      required
                      rows={3}
                      error={errors.Reporter_Suggestions?.message}
                      {...register("Reporter_Suggestions", {
                        required: "This field cannot be blank."
                      })}
                    />
                  </div>

                  <div className="mt-6">
                    <fieldset>
                      <legend className="text-sm font-medium text-gray-700 mb-3">
                        Is this an Immediately Reportable Matter (IRM) or a Routinely Reportable Matter (RRM)? <span className="text-red-500">*</span>
                      </legend>
                      <div className="space-y-2">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            value="IRM"
                            {...register("ATSB_reportable_status", { required: "This field cannot be blank." })}
                            className="mr-2"
                          />
                          Immediately reportable matter
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            value="RRM"
                            {...register("ATSB_reportable_status", { required: "This field cannot be blank." })}
                            className="mr-2"
                          />
                          Routinely reportable matter
                        </label>
                      </div>
                      {errors.ATSB_reportable_status && (
                        <p className="text-red-500 text-sm mt-1">{errors.ATSB_reportable_status.message}</p>
                      )}
                    </fieldset>
                  </div>

                  <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-red-700 font-semibold text-sm">
                      Immediately reportable matters are required to be notified to RAAus via phone as soon as practicable.
                      RAAus can be contacted on <a href="tel:+61262804700" className="text-red-700 underline">02 6280 4700</a>.
                    </p>
                  </div>
                </div>

                {/* Flight Details Section */}
                <div className="border-b border-gray-200 pb-8">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Flight Details</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input
                      label="Departure Location"
                      placeholder="Enter departure location"
                      maxLength={50}
                      error={errors.Departure_location?.message}
                      {...register("Departure_location", {
                        pattern: {
                          value: validationPatterns.alphanumericWithSpaces,
                          message: validationMessages.invalidValue
                        }
                      })}
                    />

                    <Input
                      label="Destination Location"
                      placeholder="Enter destination location"
                      maxLength={50}
                      error={errors.Destination_location?.message}
                      {...register("Destination_location", {
                        pattern: {
                          value: validationPatterns.alphanumericWithSpaces,
                          message: validationMessages.invalidValue
                        }
                      })}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    <Input
                      label="Landing"
                      placeholder="Enter landing location"
                      maxLength={50}
                      helpText="(if different to destination)"
                      error={errors.Landing?.message}
                      {...register("Landing", {
                        pattern: {
                          value: validationPatterns.alphanumericWithSpaces,
                          message: validationMessages.minLength
                        }
                      })}
                    />

                    <Select
                      label="Type of Operation"
                      required
                      options={typeOfOperationOptions}
                      error={errors.Type_of_operation?.message}
                      {...register("Type_of_operation", { 
                        required: "This field cannot be blank." 
                      })}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    {/* Flight Training School - Only show when Type of Operation is Flying Training */}
                    {(selectedTypeOfOperation === "Flying Training – Dual" || selectedTypeOfOperation === "Flying Training – Solo") && (
                      <Select
                        label="Name of Flight Training School"
                        required
                        options={flightTrainingSchoolOptions}
                        error={errors.Name_of_Flight_Training_School?.message}
                        {...register("Name_of_Flight_Training_School", { 
                          required: "This field cannot be blank." 
                        })}
                      />
                    )}

                    <Select
                      label="Phase of Flight"
                      options={phaseOfFlightOptions}
                      error={errors.Phase_of_flight?.message}
                      {...register("Phase_of_flight")}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    <Select
                      label="Effect of Flight"
                      options={effectOfFlightOptions}
                      error={errors.Effect_of_flight?.message}
                      {...register("Effect_of_flight")}
                    />

                    <Select
                      label="Flight Rules"
                      options={flightRulesOptions}
                      error={errors.Flight_Rules?.message}
                      {...register("Flight_Rules")}
                    />
                  </div>
                </div>

                {/* Airspace Section */}
                <div className="border-b border-gray-200 pb-8">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Airspace</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Select
                      label="Airspace Class"
                      options={airspaceClassOptions}
                      error={errors.Airspace_class?.message}
                      {...register("Airspace_class")}
                    />

                    <Select
                      label="Airspace Type"
                      options={airspaceTypeOptions}
                      error={errors.Airspace_type?.message}
                      {...register("Airspace_type")}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    <Input
                      label="Altitude"
                      type="text"
                      placeholder="200"
                      maxLength={10}
                      error={errors.Altitude?.message}
                      onKeyPress={(e) => {
                        // Only allow numbers and decimal point
                        if (!/[0-9.]/.test(e.key)) {
                          e.preventDefault();
                        }
                      }}
                      {...register("Altitude", {
                        pattern: {
                          value: validationPatterns.decimalNumber,
                          message: validationMessages.minLength
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
                    />

                    <Select
                      label="Altitude Type"
                      options={altitudeTypeOptions}
                      error={errors.Altitude_type?.message}
                      {...register("Altitude_type")}
                    />
                  </div>
                </div>

                {/* Environment Section */}
                <div className="border-b border-gray-200 pb-8">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Environment</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Select
                      label="Light Conditions"
                      options={lightConditionsOptions}
                      error={errors.Light_conditions?.message}
                      {...register("Light_conditions")}
                    />

                    <Input
                      label="Visibility"
                      type="text"
                      placeholder="30.0"
                      maxLength={10}
                      suffix="NM"
                      error={errors.Visibility?.message}
                      onKeyPress={(e) => {
                        // Only allow numbers and decimal point
                        if (!/[0-9.]/.test(e.key)) {
                          e.preventDefault();
                        }
                      }}
                      {...register("Visibility", {
                        pattern: {
                          value: validationPatterns.decimalNumber,
                          message: validationMessages.minLength
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
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    <Input
                      label="Wind Speed"
                      type="text"
                      placeholder="10.0"
                      maxLength={10}
                      suffix="knots"
                      error={errors.Wind_speed?.message}
                      onKeyPress={(e) => {
                        // Only allow numbers and decimal point
                        if (!/[0-9.]/.test(e.key)) {
                          e.preventDefault();
                        }
                      }}
                      {...register("Wind_speed", {
                        pattern: {
                          value: validationPatterns.decimalNumber,
                          message: validationMessages.minLength
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
                    />

                    <Select
                      label="Wind Direction"
                      options={windDirectionOptions}
                      error={errors.Wind_direction?.message}
                      {...register("Wind_direction")}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    <Select
                      label="Visibility Reduced By"
                      options={visibilityReducedByOptions}
                      error={errors.Visibility_reduced_by?.message}
                      {...register("Visibility_reduced_by")}
                    />

                    <Input
                      label="Temperature"
                      type="text"
                      placeholder="20.0"
                      maxLength={10}
                      suffix="°C"
                      error={errors.Temperature?.message}
                      onKeyPress={(e) => {
                        // Only allow numbers, decimal point, and minus sign
                        if (!/[0-9.-]/.test(e.key)) {
                          e.preventDefault();
                        }
                      }}
                      {...register("Temperature", {
                        pattern: {
                          value: validationPatterns.decimalNumber,
                          message: validationMessages.minLength
                        },
                        onChange: (e) => {
                          // Remove any non-numeric characters except decimal point and minus
                          let value = e.target.value.replace(/[^0-9.-]/g, '');
                          // Prevent multiple decimal points
                          const parts = value.split('.');
                          if (parts.length > 2) {
                            value = parts[0] + '.' + parts.slice(1).join('');
                          }
                          // Ensure minus sign is only at the beginning
                          if (value.indexOf('-') > 0) {
                            value = value.replace(/-/g, '');
                          }
                          e.target.value = value;
                        }
                      })}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    <Select
                      label="Wind Gusting"
                      required
                      options={windGustingOptions}
                      error={errors.Wind_gusting?.message}
                      {...register("Wind_gusting", { 
                        required: "This field cannot be blank." 
                      })}
                    />

                    <Select
                      label="Personal Locator Beacon carried"
                      required
                      options={yesNoOptions}
                      error={errors.Personal_Locator_Beacon_carried?.message}
                      {...register("Personal_Locator_Beacon_carried", { 
                        required: "This field cannot be blank." 
                      })}
                    />
                  </div>
                </div>

                {/* Special Incident Types - Checkbox Selection */}
                <div className="border-b border-gray-200 pb-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Checkbox
                        label="Involve near miss with another aircraft"
                        checked={didInvolveNearMiss}
                        onCheckedChange={(checked) => {
                          setDidInvolveNearMiss(checked);
                          // Also update the form value
                          setValue("Involve_near_miss_with_another_aircraft", checked);
                        }}
                      />
                    </div>

                    <div className="space-y-2">
                      <Checkbox
                        label="Bird or Animal Strike"
                        checked={didInvolveBirdAnimalStrike}
                        onCheckedChange={(checked) => {
                          setDidInvolveBirdAnimalStrike(checked);
                          // Also update the form value
                          setValue("Bird_or_Animal_Strike", checked);
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Bird/Animal Strike Section - Conditional */}
                {didInvolveBirdAnimalStrike && (
                  <div className="border-b border-gray-200 pb-8">
                    <h2 className="text-xl font-semibold text-gray-900 mb-6">Bird/animal strike</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Select
                        label="Type of Strike"
                        options={strikeTypeOptions}
                        error={errors.Type_of_strike?.message}
                        {...register("Type_of_strike")}
                      />

                      <Select
                        label="Size"
                        options={sizeOptions}
                        error={errors.Size?.message}
                        {...register("Size")}
                      />
                    </div>

                    <div className="mt-6">
                      <Input
                        label="Species"
                        placeholder="Enter species name"
                        maxLength={50}
                        error={errors.Species?.message}
                        {...register("Species", {
                          minLength: { value: 2, message: validationMessages.minLength }
                        })}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                      <Select
                        label="Number (approx)"
                        options={numberOptions}
                        error={errors.Number_approx?.message}
                        {...register("Number_approx")}
                      />

                      <Select
                        label="Number Struck (approx)"
                        options={numberOptions}
                        error={errors.Number_struck_approx?.message}
                        {...register("Number_struck_approx")}
                      />
                    </div>
                  </div>
                )}

                {/* Near Miss Section - Conditional */}
                {didInvolveNearMiss && (
                  <div className="border-b border-gray-200 pb-8">
                    <h2 className="text-xl font-semibold text-gray-900 mb-6">Near Collision with another aircraft</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Input
                        label="Second Aircraft Registration"
                        placeholder="10-1122 or E13-1199"
                        maxLength={8}
                        error={errors.Second_aircraft_registration?.message}
                        onKeyPress={(e) => {
                          // Only allow alphanumeric and hyphen
                          if (!/[a-zA-Z0-9-]/.test(e.key)) {
                            e.preventDefault();
                          }
                        }}
                        {...register("Second_aircraft_registration", {
                          pattern: {
                            value: validationPatterns.aircraftRegistration,
                            message: validationMessages.aircraftRegistration
                          },
                          onChange: (e) => {
                            // Remove any non-alphanumeric characters except hyphen
                            let value = e.target.value.replace(/[^a-zA-Z0-9-]/g, '');
                            // Convert to uppercase
                            value = value.toUpperCase();
                            // Ensure only one hyphen
                            const parts = value.split('-');
                            if (parts.length > 2) {
                              value = parts[0] + '-' + parts.slice(1).join('');
                            }
                            e.target.value = value;
                          }
                        })}
                      />

                      <Input
                        label="Second Aircraft Manufacturer"
                        placeholder="abc-123"
                        maxLength={16}
                        error={errors.Second_Aircraft_Manufacturer?.message}
                        {...register("Second_Aircraft_Manufacturer", {
                          pattern: {
                            value: validationPatterns.alphanumericDashSpace,
                            message: validationMessages.minLength
                          },
                          minLength: {
                            value: 3,
                            message: validationMessages.minLength
                          }
                        })}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                      <Input
                        label="Second Aircraft Model"
                        placeholder="abc-123"
                        maxLength={16}
                        error={errors.Second_Aircraft_Model?.message}
                        {...register("Second_Aircraft_Model", {
                          pattern: {
                            value: validationPatterns.alphanumericDashSpace,
                            message: validationMessages.minLength
                          },
                          minLength: {
                            value: 3,
                            message: validationMessages.minLength
                          }
                        })}
                      />

                      <Input
                        label="Horizontal Proximity"
                        type="text"
                        placeholder="e.g., 150"
                        maxLength={10}
                        error={errors.Horizontal_Proximity?.message}
                        onKeyPress={(e) => {
                          // Only allow numbers and decimal point
                          if (!/[0-9.]/.test(e.key)) {
                            e.preventDefault();
                          }
                        }}
                        {...register("Horizontal_Proximity", {
                          pattern: {
                            value: validationPatterns.decimalNumber,
                            message: validationMessages.minLength
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
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                      <Select
                        label="Horizontal Proximity Unit"
                        options={proximityUnitOptions}
                        error={errors.Horizontal_Proximity_Unit?.message}
                        {...register("Horizontal_Proximity_Unit")}
                      />

                      <Input
                        label="Vertical Proximity"
                        type="text"
                        placeholder="e.g., 0.5"
                        maxLength={10}
                        error={errors.Vertical_Proximity?.message}
                        onKeyPress={(e) => {
                          // Only allow numbers and decimal point
                          if (!/[0-9.]/.test(e.key)) {
                            e.preventDefault();
                          }
                        }}
                        {...register("Vertical_Proximity", {
                          pattern: {
                            value: validationPatterns.decimalNumber,
                            message: validationMessages.minLength
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
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                      <Select
                        label="Vertical Proximity Unit"
                        options={verticalProximityUnitOptions}
                        error={errors.Vertical_Proximity_Unit?.message}
                        {...register("Vertical_Proximity_Unit")}
                      />

                      <Select
                        label="Relative Track"
                        options={relativeTrackOptions}
                        error={errors.Relative_Track?.message}
                        {...register("Relative_Track")}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                      <Select
                        label="Avoidance Manoeuvre Needed?"
                        options={avoidanceManoeuvreOptions}
                        error={errors.Avoidance_manoeuvre_needed?.message}
                        {...register("Avoidance_manoeuvre_needed")}
                      />

                      <Select
                        label="Alert Received"
                        options={alertReceivedOptions}
                        error={errors.Alert_Received?.message}
                        {...register("Alert_Received")}
                      />
                    </div>
                  </div>
                )}

                {/* Navigation Buttons */}
                <div className="flex justify-between pt-8 border-t border-gray-200">
                  <Button
                    type="button"
                    onClick={prevStep}
                    variant="outline"
                    className="px-8 py-2"
                  >
                    Previous: Pilot Information
                  </Button>
                  <Button
                    type="button"
                    onClick={nextStep}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-2"
                  >
                    Next: Aircraft Information
                  </Button>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-8">
                {/* Aircraft Information Section */}
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Aircraft Information</h2>
                  
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
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Select
                      label="Registration Number Prefix"
                      required
                      options={registrationPrefixOptions}
                      {...register('Registration_number', { required: 'Registration number is required' })}
                      error={errors.Registration_number?.message}
                    />
                    
                    <Input
                      label="Registration Number Suffix"
                      placeholder="1234"
                      required
                      maxLength={4}
                      onKeyPress={(e) => {
                        // Only allow numbers (0-9)
                        if (!/[0-9]/.test(e.key)) {
                          e.preventDefault();
                        }
                      }}
                      {...register('Serial_number1', { 
                        required: 'Serial number is required',
                        minLength: { value: 4, message: 'Minimum 4 characters required' },
                        maxLength: { value: 4, message: 'Minimum 4 characters required' },
                        pattern: { value: validationPatterns.registrationSuffix, message: 'Must be exactly 4 digits' },
                        onChange: (e) => {
                          // Remove any non-numeric characters
                          e.target.value = e.target.value.replace(/[^0-9]/g, '');
                        }
                      })}
                      error={errors.Serial_number1?.message}
                    />

                    <Input
                      label="Serial Number"
                      required
                      maxLength={50}
                      onKeyPress={(e) => {
                        // Only allow numbers and decimal point
                        if (!/[0-9.]/.test(e.key)) {
                          e.preventDefault();
                        }
                      }}
                      {...register('Serial_number', { 
                        required: 'Serial number is required',
                        minLength: { value: 3, message: validationMessages.minLength },
                        pattern: {
                          value: /^[0-9.]+$/,
                          message: "Serial number must contain only numbers and periods (e.g., 08.08.51.743)"
                        },
                        onChange: (e) => {
                          // Remove any non-numeric characters except decimal point
                          e.target.value = e.target.value.replace(/[^0-9.]/g, '');
                        }
                      })}
                      error={errors.Serial_number?.message}
                    />
                    
                    <Input
                      label="Make"
                      required
                      maxLength={50}
                      {...register('Make1', { 
                        required: 'Aircraft make is required',
                        minLength: { value: 2, message: validationMessages.minLength }
                      })}
                      error={errors.Make1?.message}
                    />
                    
                    <Input
                      label="Model"
                      required
                      maxLength={50}
                      {...register('Model', { 
                        required: 'Aircraft model is required',
                        minLength: { value: 2, message: validationMessages.minLength }
                      })}
                      error={errors.Model?.message}
                    />
                    
                    <Select
                      label="Registration Status"
                      required
                      options={registrationStatusOptions}
                      {...register('Registration_status', { required: 'Registration status is required' })}
                      error={errors.Registration_status?.message}
                    />
                    
                    <Select
                      label="Type"
                      required
                      options={aircraftTypeOptions}
                      {...register('Type1', { required: 'Aircraft type is required' })}
                      error={errors.Type1?.message}
                    />
                    
                    <Select
                      label="Year Built"
                      required
                      options={yearBuiltOptions}
                      {...register('Year_Built1', { required: 'Year built is required' })}
                      error={errors.Year_Built1?.message}
                    />
                    
                    <Input
                      label="Total Airframe Hours"
                      type="text"
                      placeholder="200"
                      maxLength={10}
                      onKeyPress={(e) => {
                        // Only allow numbers and decimal point
                        if (!/[0-9.]/.test(e.key)) {
                          e.preventDefault();
                        }
                      }}
                      {...register('Total_airframe_hours', {
                        pattern: {
                          value: validationPatterns.decimalNumber,
                          message: validationMessages.minLength
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
                      error={errors.Total_airframe_hours?.message}
                    />
                  </div>
                </div>

                {/* Engine Details Section */}
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Engine Details</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input
                      label="Engine Make"
                      required
                      maxLength={50}
                      onKeyPress={(e) => {
                        // Only allow alphanumeric, spaces, and hyphens
                        if (!/[a-zA-Z0-9 -]/.test(e.key)) {
                          e.preventDefault();
                        }
                      }}
                      {...register('Engine_Details', { 
                        required: 'Engine make is required',
                        minLength: { value: 2, message: validationMessages.minLength },
                        pattern: {
                          value: /^[a-zA-Z0-9 -]+$/,
                          message: "Engine make can only contain letters, numbers, spaces, and hyphens"
                        },
                        onChange: (e) => {
                          // Remove any characters except alphanumeric, spaces, and hyphens
                          e.target.value = e.target.value.replace(/[^a-zA-Z0-9 -]/g, '');
                        }
                      })}
                      error={errors.Engine_Details?.message}
                    />
                    
                    <Input
                      label="Engine Model"
                      maxLength={50}
                      onKeyPress={(e) => {
                        // Only allow alphanumeric, spaces, and hyphens
                        if (!/[a-zA-Z0-9 -]/.test(e.key)) {
                          e.preventDefault();
                        }
                      }}
                      {...register('Engine_model', {
                        minLength: { value: 2, message: validationMessages.minLength },
                        pattern: {
                          value: /^[a-zA-Z0-9 -]+$/,
                          message: "Engine model can only contain letters, numbers, spaces, and hyphens"
                        },
                        onChange: (e) => {
                          // Remove any characters except alphanumeric, spaces, and hyphens
                          e.target.value = e.target.value.replace(/[^a-zA-Z0-9 -]/g, '');
                        }
                      })}
                      error={errors.Engine_model?.message}
                    />
                    
                    <Input
                      label="Engine Serial"
                      maxLength={50}
                      {...register('Engine_serial', {
                        minLength: { value: 2, message: validationMessages.minLength }
                      })}
                      error={errors.Engine_serial?.message}
                    />
                    
                    <Input
                      label="Total Engine Hours"
                      type="text"
                      placeholder="200"
                      maxLength={10}
                      onKeyPress={(e) => {
                        // Only allow numbers and decimal point
                        if (!/[0-9.]/.test(e.key)) {
                          e.preventDefault();
                        }
                      }}
                      {...register('Total_engine_hours', {
                        pattern: {
                          value: validationPatterns.decimalNumber,
                          message: validationMessages.minLength
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
                      error={errors.Total_engine_hours?.message}
                    />
                    
                    <div className="md:col-start-2">
                      <Input
                        label="Total Hours Since Service"
                        type="text"
                        placeholder="103"
                        maxLength={10}
                        onKeyPress={(e) => {
                          // Only allow numbers and decimal point
                          if (!/[0-9.]/.test(e.key)) {
                            e.preventDefault();
                          }
                        }}
                        {...register('Total_hours_since_service', {
                          pattern: {
                            value: validationPatterns.decimalNumber,
                            message: validationMessages.minLength
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
                        error={errors.Total_hours_since_service?.message}
                      />
                    </div>
                  </div>
                </div>

                {/* Propeller Details Section */}
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Propeller Details</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input
                      label="Propeller Make"
                      maxLength={50}
                      {...register('Propeller_make', {
                        minLength: { value: 2, message: validationMessages.minLength }
                      })}
                      error={errors.Propeller_make?.message}
                    />
                    
                    <Input
                      label="Propeller Model"
                      maxLength={50}
                      {...register('Propeller_model', {
                        minLength: { value: 2, message: validationMessages.minLength }
                      })}
                      error={errors.Propeller_model?.message}
                    />
                    
                    <Input
                      label="Propeller Serial"
                      maxLength={50}
                      {...register('Propeller_serial', {
                        minLength: { value: 2, message: validationMessages.minLength }
                      })}
                      error={errors.Propeller_serial?.message}
                    />
                    
                    <Select
                      label="Personal Locator Beacon carried"
                      required
                      options={plbOptions}
                      {...register('Personal_Locator_Beacon_carried', { required: 'PLB status is required' })}
                      error={errors.Personal_Locator_Beacon_carried?.message}
                    />
                  </div>
                  
                  <div className="mt-4">
                    <Checkbox
                      label="PLB Activated"
                      id="plbActivated"
                      {...register('PLB_Activated')}
                    />
                  </div>
                </div>

                {/* Attachments Section */}
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Attachments</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Upload Supporting Documents
                      </label>
                      <p className="text-sm text-gray-500 mb-2">
                        Upload photos and videos as evidence. Additionally include engine, propeller and airframe maintenance inspection documentation from logbooks as it pertains to the report.
                      </p>
                      <FileUpload
                        accept=".csv,.doc,.docm,.docx,.gif,.jpg,.jpeg,.jpe,.pdf,.txt,.asc,.c,.cc,.h,.srt,.xla,.xls,.xlt,.xlw,.xlsx,.zip"
                        multiple
                        onChange={setAttachments}
                        maxFiles={5}
                        maxSize={256}
                        error={errors.attachments?.message}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-between pt-8 border-t border-gray-200">
                  <Button
                    type="button"
                    onClick={prevStep}
                    variant="outline"
                    className="px-8 py-2"
                  >
                    Previous: Occurrence Information
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-green-500 hover:bg-green-600 text-white px-8 py-2"
                  >
                    {isSubmitting ? "Submitting..." : "Submit"}
                  </Button>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
