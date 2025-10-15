"use client";

import { useState, useEffect } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { SelectWithOther } from "@/components/ui/SelectWithOther";
import SearchableDropdown from "@/components/ui/SearchableDropdown";
import { PhoneInput } from "@/components/ui/PhoneInput";
import { DatePicker } from "@/components/ui/DatePicker";
import { Textarea } from "@/components/ui/Textarea";
import { Checkbox } from "@/components/ui/Checkbox";
import { Button } from "@/components/ui/Button";
import { FileUpload } from "@/components/ui/FileUpload";
import MapPicker from "@/components/ui/MapPicker";
import { AccidentFormData } from "@/types/forms";
import { validationPatterns, validationMessages, validateEmail } from "@/lib/validations/patterns";
import { useFormPersistence, useSpecialStatePersistence, clearFormOnSubmission } from "@/lib/utils/formPersistence";
import AccidentPreview from "@/components/forms/AccidentPreview";
import axios from "axios";
import Link from "next/link";
import "./wizard.css";

// Import CountryCode type for phone country state
type CountryCode = 
  | "AU" | "CA" | "GB" | "US" | "NZ" | "DE" | "FR" | "IT" | "ES" | "NL" 
  | "BE" | "CH" | "SE" | "NO" | "DK" | "FI" | "IE" | "PT" | "AT" | "PL" 
  | "CZ" | "HU" | "GR" | "TR" | "RU" | "JP" | "KR" | "CN" | "IN" | "BR" 
  | "MX" | "AR" | "ZA" | "EG" | "NG" | "KE" | "AE" | "SA" | "TH" | "SG" 
  | "MY" | "ID" | "PH";

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
  { value: "Aerodrome Operator", label: "Aerodrome Operator" },
  { value: "Air Traffic Control", label: "Air Traffic Control" },
  { value: "Aircraft Owner", label: "Aircraft Owner" },
  { value: "CASA", label: "CASA" },
  { value: "Crew", label: "Crew" },
  { value: "LAME", label: "LAME" },
  { value: "Maintainer", label: "Maintainer" },
  { value: "Operator", label: "Operator" },
  { value: "Other", label: "Other" },
  { value: "Owner", label: "Owner" },
  { value: "Pilot in Command", label: "Pilot in Command" },
  { value: "Rescue/Fire Service", label: "Rescue/Fire Service" },
  { value: "Witness", label: "Witness" },
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
  "Please Select -",
  "Adelaide Biplanes",
  "Adelaide Biplanes - Weightshift (Group B)",
  "Adelaide Soaring Club Inc",
  "Advanced Aviation Training",
  "Adventure Flight Training - Moama",
  "Aerchute Industries",
  "Aerofloat",
  "Aerohunter Flight Training",
  "AeroLINQ",
  "AeroLINQ - Watsbridge",
  "Agnes Water Air Services",
  "Air Escape",
  "Airspeed Aviation",
  "Airsports Flying School",
  "Airwego",
  "Airwings Flight Centre",
  "Alpine Aviation Australia",
  "Ariel Aviation",
  "Ausflight Pty Ltd",
  "Avid Aviation",
  "Ayr Flying Services",
  "Balantree Aviation",
  "Ballarat Aero Club",
  "Ballarat Flight Training",
  "Batchelor Flight Training",
  "Benalla Aero Club",
  "Benalla Recreational Flying",
  "Bendigo Flying Club",
  "Bendigo Recreational Aviation School - Comfly",
  "BJs Aviation",
  "Blue Shed Aviation",
  "Blue Shed Aviation - Temora",
  "Blue Sky Flight Training",
  "Blue Sky Flight Training (West Sale)",
  "Bob Harris' Flying School",
  "Bunbury Aero Club",
  "Bunbury Aero Club - Manjimup",
  "Busselton Aero Club",
  "Caboolture Flight School",
  "Caboolture Recreational Aviation",
  "Classic Air",
  "Clement's Flying School",
  "Cloud Dancer Pilot Training",
  "Coffs Harbour & District Aero Club",
  "Colac Flight Training",
  "Corowa Recreational Flying",
  "Cory Air – Coonawara",
  "Cowra Aero Club - Forbes",
  "Cowra And District Aero Club Inc",
  "Dave's Flying School",
  "Eagle Air Pty Ltd",
  "Eagle Air Pty Ltd - Boonah",
  "EAS Flight Training",
  "Echuca Moama School of Aviation Pty Ltd",
  "Edge Aerospace",
  "Edge Aerospace - Riddells Creek",
  "Flight Testing",
  "Flightscope Aviation",
  "Fly Illawarra",
  "Fly Now Redcliffe",
  "Fly Riverina - Cootamundra",
  "Fly Riverina - Deniliquin",
  "Flying with Grace",
  "FN Aviation",
  "Gladstone Flying Training & Aircharter",
  "GoFly Aviation",
  "Gold Coast Sports Flying Training",
  "Golden Plains Aviation Pty Ltd",
  "Goolwa Air Flight Training",
  "Goulburn Aviation Pty Ltd",
  "Goulburn Flight Training Centre",
  "Granite Field Flight Training",
  "Griffith Aero Club",
  "Griffith Aero Club - Hillston",
  "Hastings District Flying Club",
  "Hawkesbury Powered Parachute Centre",
  "Howatharra Aviation",
  "JDH Aviation Pty Ltd T/A Recreational Pilots Academy",
  "John McBryde - Recreational Flying",
  "Kangawallaafox Flight School",
  "KB's Flying School",
  "Knowsley Airpark",
  "Kyneton Aero Club",
  "Lake Keepit Soaring Club",
  "Latrobe Valley Aero Club",
  "Learn 2 Fly Bathurst",
  "Learn 2 Fly Canberra",
  "Lilydale Flying School",
  "Lite Air Flying Training",
  "Lone Eagle Flying School",
  "Matts Flying",
  "Melbourne West Flight Training",
  "Mid Coast Flying",
  "Midlands Flying School",
  "Murray Bridge Light Aircraft Flying School",
  "Myrup Flight Training",
  "Namoi Aviation",
  "Namoi Aviation - Gunnedah",
  "New England Aviation Flight Training School",
  "Northern Rivers Aero Club",
  "NT Flight Training",
  "Oasis Flight Training Pty Ltd",
  "Oasis Flight Training Pty Ltd - Swan Hill",
  "Orange Flight Training",
  "Parkes Recreational Aviation Centre",
  "Pathfinder Aviation",
  "Peace Aviation",
  "Peace Aviation - Bundaberg",
  "Peninsula Aero Club",
  "Pro-Sky Flight Training",
  "Pro-sky Maryborough",
  "Pro-Sky Port Augusta",
  "RAMAIR Flying Services",
  "Recreational Aviation Newcastle",
  "Riverina Wings Flight Training",
  "Riverland Flight Training",
  "Riverland Flight Training Wentworth",
  "Riviera Aeronautics",
  "Rockhampton Sport Aviation",
  "Rotor-Sport Australia",
  "Royal Aero Club of Western Australia",
  "Sarge's Light Sport Aviation",
  "Secure Air Flight Training",
  "SFA Recreational Aviation",
  "SkyEast Aviation",
  "Skyflyte ULA Pty Ltd - Devonport",
  "Skyflyte ULA Pty Ltd",
  "Skywise Microlights",
  "Smartair",
  "Spencer Gulf Flight Training Pty Ltd",
  "Sport Aviation Flight Academy",
  "SportAviation Pty Ltd",
  "Sportflly Aviation",
  "Sportsflite Australia",
  "Stick 'n Rudder",
  "Strike Aviation Training",
  "Sunshine Coast Aero Club Queensland Ltd",
  "Sunshine Coast Sports Flying Training",
  "Surf Coast Flying School",
  "Sydney Recreational Flying Club - Taree",
  "Sydney Recreational Flying Club Inc",
  "The Recreational Flying Company",
  "Tooradin Flying School",
  "Topfun Aviation - Greenside",
  "Topfun Aviation - Moora",
  "Townsville Sport Aviation",
  "Victory Flight Training",
  "Wagga Air Centre",
  "Wagga Bike Tyres - Aviation Division",
  "Walters Aviation",
  "Warrnambool Flight Training",
  "Watson Fly",
  "West Coast Aviation",
  "Westside Aviation",
  "White Star Aviation Pty Ltd",
  "Willflyhire",
  "Wings Out West",
  "Wrighton Aviation",
  "Yarra Valley Flight Training",
  "YET TO BE DETERMINED"
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
  { value: "None", label: "None" },
  { value: "Non-Controlled", label: "Non-Controlled" },
  { value: "Controlled", label: "Controlled" },
  { value: "Danger Area", label: "Danger Area" },
  { value: "Military Operating Area", label: "Military Operating Area" },
  { value: "Restricted Area", label: "Restricted Area" },
  { value: "Prohibited Area", label: "Prohibited Area" },
];

const altitudeTypeOptions = [
  { value: "None", label: "None" },
  { value: "AMSL (Above Mean Sea Level)", label: "AMSL (Above Mean Sea Level)" },
  { value: "AGL (Above Ground Level)", label: "AGL (Above Ground Level)" },
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
  { value: "Dusk", label: "Dusk" },
  { value: "Haze", label: "Haze" },
  { value: "Other", label: "Other" },
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

  // Maintainer validation states
  const [maintainerValidationStatus, setMaintainerValidationStatus] = useState<"valid" | "invalid" | "">("");
  const [maintainerValidationMessage, setMaintainerValidationMessage] = useState("");
  const [isValidatingMaintainer, setIsValidatingMaintainer] = useState(false);


  const [contactPhone, setContactPhone] = useState("");
  const [contactPhoneError, setContactPhoneError] = useState("");
  const [contactPhoneCountry, setContactPhoneCountry] = useState<CountryCode>("AU");
  const [pilotContactPhone, setPilotContactPhone] = useState("");
  const [pilotContactPhoneError, setPilotContactPhoneError] = useState("");
  const [pilotContactPhoneCountry, setPilotContactPhoneCountry] = useState<CountryCode>("AU");
  const [occurrenceDate, setOccurrenceDate] = useState("");
  const [occurrenceDateError, setOccurrenceDateError] = useState("");
  const [occurrenceTime, setOccurrenceTime] = useState("");
  const [occurrenceTimeError, setOccurrenceTimeError] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [attachments, setAttachments] = useState<FileList | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState<AccidentFormData | null>(null);

  // Aircraft lookup states
  const [isLookingUpAircraft, setIsLookingUpAircraft] = useState(false);
  const [aircraftLookupStatus, setAircraftLookupStatus] = useState<"success" | "error" | "">("");
  const [aircraftLookupMessage, setAircraftLookupMessage] = useState("");

  const methods = useForm<AccidentFormData>();
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    trigger,
    reset,
    formState: { errors },
  } = methods;

  // Form persistence for current step
  const { clearCurrentForm } = useFormPersistence(
    { formType: 'accident', stepIndex: currentStep, maxSteps: 3 }, 
    watch, 
    setValue, 
    reset
  );

  // Special state persistence - Step 1: Contact phone numbers and countries
  const { clearSpecialState: clearStep1SpecialState } = useSpecialStatePersistence(
    'accident',
    1,
    {
      contactPhone,
      pilotContactPhone,
      contactPhoneCountry,
      pilotContactPhoneCountry
    },
    {
      contactPhone: setContactPhone,
      pilotContactPhone: setPilotContactPhone,
      contactPhoneCountry: setContactPhoneCountry,
      pilotContactPhoneCountry: setPilotContactPhoneCountry
    }
  );

  // Special state persistence - Step 2: Occurrence date/time, and GPS coordinates
  const { clearSpecialState: clearStep2SpecialState } = useSpecialStatePersistence(
    'accident',
    2,
    {
      occurrenceDate,
      occurrenceTime,
      latitude,
      longitude
    },
    {
      occurrenceDate: setOccurrenceDate,
      occurrenceTime: setOccurrenceTime,
      latitude: setLatitude,
      longitude: setLongitude
    }
  );

  // Combined clear function for all special state
  const clearSpecialState = () => {
    clearStep1SpecialState();
    clearStep2SpecialState();
  };



  // Watch the type of operation field to conditionally show flight training school
  const selectedTypeOfOperation = watch("Type_of_operation");
  
  // Watch the role field to conditionally show/hide Pilot in Command section
  const selectedRole = watch("role");
  
  // Watch fields with 'Other' option
  const selectedFlightSchool = watch("Name_of_Flight_Training_School");
  const selectedRelativeTrack = watch("Relative_Track");
  const selectedAlertReceived = watch("Alert_Received");
  
  // Watch the incident type fields for conditional sections
  const didInvolveNearMiss = watch("Involve_near_miss_with_another_aircraft") === "Yes";
  const didInvolveBirdAnimalStrike = watch("Bird_or_Animal_Strike") === "Yes";
  const selectedDamageToAircraft = watch("Damage_to_aircraft");
  
  // Watch ATSB reportable status for conditional IRM notification
  const selectedReportableStatus = watch("ATSB_reportable_status");
  
  // Watch aerodrome vicinity for conditional Y Code field
  const selectedAerodromeVicinity = watch("In_vicinity_of_aerodrome");
  
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

  // Validate maintainer member number with immediate feedback
  const validateMaintainer = async (memberNumber: string, firstName: string, lastName: string) => {
    // Reset validation if any field is empty
    if (!memberNumber || !firstName || !lastName) {
      setMaintainerValidationStatus("");
      setMaintainerValidationMessage("");
      return;
    }

    setIsValidatingMaintainer(true);

    try {
      const response = await axios.post("/api/validate-member", {
        memberNumber,
        firstName,
        lastName,
      });

      if (response.data.valid) {
        setMaintainerValidationStatus("valid");
        setMaintainerValidationMessage("✓ Member Number exists in system");
      } else {
        setMaintainerValidationStatus("invalid");
        setMaintainerValidationMessage(response.data.warning || "Member Number not found");
      }
    } catch (error) {
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
        "customRole", // Add custom role to the clearing list
        "firstName", 
        "lastName",
        "emailAddress"
      ];
      
      // Validate contact phone - PhoneInput component handles its own validation
      if (!contactPhone || contactPhone.trim() === "") {
        setContactPhoneError("Contact Phone is required");
        hasError = true;
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
      
      // Remove description field from validation if damage is "Nil"
      if (selectedDamageToAircraft === "Nil") {
        fieldsToValidate = fieldsToValidate.filter(field => field !== "Description_of_damage_to_aircraft");
      }
      
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

  const handlePreview = (data: AccidentFormData) => {
    // Validate required fields before showing preview
    if (!occurrenceDate || !occurrenceTime) {
      alert("Please provide both occurrence date and time");
      return;
    }

    if (!contactPhone) {
      alert("Please provide a contact phone number");
      return;
    }

    // Store form data and show preview
    setPreviewData(data);
    setShowPreview(true);
  };

  const handleBackToEdit = () => {
    setShowPreview(false);
  };

  const onSubmit = async () => {
    if (!previewData) return;
    
    setIsSubmitting(true);

    try {
      const data = previewData;

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
        // Use custom values if "Other" is selected, otherwise use the dropdown value
        role: data.role === "Other" && data.customRole && data.customRole.trim() ? data.customRole.trim() : data.role,
        Name_of_Flight_Training_School: data.Name_of_Flight_Training_School === "Other" && data.customFlightSchool && data.customFlightSchool.trim() ? data.customFlightSchool.trim() : data.Name_of_Flight_Training_School,
        Relative_Track: data.Relative_Track === "Other" && data.customRelativeTrack && data.customRelativeTrack.trim() ? data.customRelativeTrack.trim() : data.Relative_Track,
        Alert_Received: data.Alert_Received === "Other" && data.customAlertReceived && data.customAlertReceived.trim() ? data.customAlertReceived.trim() : data.Alert_Received,
        contactPhone: contactPhone,
        pilotContactPhone: pilotContactPhone,
        occurrenceDate: datetime.toISOString().slice(0, 19), // YYYY-MM-DDTHH:mm:ss format
        // GPS Coordinates (uncomment when Zoho fields are created):
        // Location_Latitude: latitude || "",
        // Location_Longitude: longitude || "",
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
        setShowPreview(false);
        setSubmitSuccess(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
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

  if (showPreview && previewData) {
    return (
      <AccidentPreview
        data={previewData}
        occurrenceDate={occurrenceDate}
        occurrenceTime={occurrenceTime}
        contactPhone={contactPhone}
        pilotContactPhone={pilotContactPhone}
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
    <FormProvider {...methods}>
      <div className="min-h-screen bg-slate-200 py-8 px-4">
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
                  /<span className="text-slate-900 ml-2">Accident Form</span>
                </div>
              </li>
            </ol>
          </nav>
        </div>

        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Lodge a New Accident or Incident</h1>
          <div className="w-[80%] mx-auto h-px bg-gray-300"></div>
        </div>

        {/* Wizard Navigation */}
        {/* <div className="bg-white shadow-lg rounded-lg mb-8 overflow-hidden"> */}
        <div className="bg-transparent rounded-lg mb-3 overflow-hidden block w-full">
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
        <div className="bg-white rounded-lg shadow-lg p-8 relative border-gray-400">
          <form onSubmit={handleSubmit(handlePreview)}>
            {currentStep === 1 && (
              <div className="space-y-8">
                {/* Person Reporting Section */}
                <div className="border-b border-gray-200 pb-8">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Person Reporting
                  {/* Clear Form Button */}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        clearCurrentForm();
                        clearSpecialState();
                        // Clear file attachments
                        setAttachments(null);
                      }}
                      className="bg-red-50 !absolute right-4 top-3 text-red-600 border-red-200 hover:bg-red-100 mb-2 inline float-right"
                    >
                      Clear Form
                    </Button>
                  </h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-4">
                    <SelectWithOther
                      name="role"
                      customFieldName="customRole"
                      label="Role"
                      required
                      options={roleOptions}
                      error={errors.role?.message}
                      customFieldPlaceholder="e.g., Flight Instructor, Engineer, Manager"
                      customFieldMaxLength={100}
                      customFieldKeyPress={(e) => {
                        // Allow letters, spaces, hyphens, periods, apostrophes
                        if (!/[a-zA-Z\s\-.']/i.test(e.key)) {
                          e.preventDefault();
                        }
                      }}
                      customFieldValidation={{
                        minLength: { value: 2, message: "Role must be at least 2 characters" },
                        maxLength: { value: 100, message: "Role cannot exceed 100 characters" },
                        pattern: {
                          value: /^[a-zA-Z\s\-.']+$/,
                          message: "Only letters, spaces, hyphens, periods and apostrophes are allowed"
                        }
                      }}
                      onCustomChange={(e) => {
                        // Auto-capitalize first letter of each word
                        const value = e.target.value;
                        if (value) {
                          const words = value.split(' ');
                          const capitalizedWords = words.map((word: string) => 
                            word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
                          );
                          e.target.value = capitalizedWords.join(' ');
                        }
                      }}
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
                      countries={["AU", "CA", "GB", "US", "NZ", "DE", "FR", "IT", "ES", "NL", "BE", "CH", "SE", "NO", "DK", "FI", "IE", "PT", "AT", "PL", "CZ", "HU", "GR", "TR", "RU", "JP", "KR", "CN", "IN", "BR", "MX", "AR", "ZA", "EG", "NG", "KE", "AE", "SA", "TH", "SG", "MY", "ID", "PH"]}
                      error={contactPhoneError}
                    />
                  </div>

                  {/* Date of Birth - Shows when 'Pilot in Command' is selected in Person Reporting */}
                  {selectedRole === "Pilot in Command" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
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
                            const birthDate = new Date(value + 'T00:00:00');
                            const today = new Date();
                            let age = today.getFullYear() - birthDate.getFullYear();
                            const monthDiff = today.getMonth() - birthDate.getMonth();
                            const dayDiff = today.getDate() - birthDate.getDate();
                            if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
                              age--;
                            }
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
                        countries={["AU", "CA", "GB", "US", "NZ", "DE", "FR", "IT", "ES", "NL", "BE", "CH", "SE", "NO", "DK", "FI", "IE", "PT", "AT", "PL", "CZ", "HU", "GR", "TR", "RU", "JP", "KR", "CN", "IN", "BR", "MX", "AR", "ZA", "EG", "NG", "KE", "AE", "SA", "TH", "SG", "MY", "ID", "PH"]}
                        error={pilotContactPhoneError || errors.PIC_Contact_Phone?.message}
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

                  <div className="mt-6 grid grid-cols-2 gap-4">
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

                  <div className="mt-6">
                    <MapPicker
                      latitude={latitude}
                      longitude={longitude}
                      onLocationSelect={(lat, lng) => {
                        setLatitude(lat);
                        setLongitude(lng);
                      }}
                      label="Pinpoint Location on Map (Optional)"
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
                      required
                      options={yesNoOptions}
                      error={errors.Involve_IFR_or_Air_Transport_Operations?.message}
                      {...register("Involve_IFR_or_Air_Transport_Operations", { required: "This field cannot be blank." })}
                    />
                  </div>


                  <div className="mt-6">
                    <Select
                      label="Did the occurrence take place in controlled airspace or special use airspace(military/danger/restricted/prohibited)?"
                      required
                      options={yesNoOptions}
                      error={errors.In_controlled_or_special_use_airspace?.message}
                      {...register("In_controlled_or_special_use_airspace", { required: "This field cannot be blank." })}
                    />
                  </div>


                  {/* Move these two fields above 'In the vicinity of an aerodrome?' and display side by side */}
                  <div className="mt-6 space-y-6">
                    <div>
                      <Select
                        label="Involve near miss with another aircraft?"
                        options={yesNoOptions}
                        error={errors.Involve_near_miss_with_another_aircraft?.message}
                        {...register("Involve_near_miss_with_another_aircraft")}
                      />

                      {/* Near Miss Section - Conditional */}
                      {didInvolveNearMiss && (
                        <div className="mt-6 border-b border-gray-200 pb-8">
                          <h2 className="text-xl font-semibold text-gray-900 mb-6">Near Collision with another aircraft</h2>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Input
                              label="Second Aircraft Registration"
                              placeholder="10-1234 or VH-ABC"
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
                              placeholder="Cessna"
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
                              placeholder="172"
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

                            <div>
                              <Select
                                label="Relative Track"
                                options={relativeTrackOptions}
                                error={errors.Relative_Track?.message}
                                {...register("Relative_Track")}
                              />

                              {/* Custom Relative Track Input - Shows when 'Other' is selected */}
                              {selectedRelativeTrack === "Other" && (
                                <div className="mt-3">
                                  <Input
                                    label="Please specify relative track"
                                    placeholder="e.g., Parallel"
                                    maxLength={50}
                                    error={errors.customRelativeTrack?.message}
                                    {...register("customRelativeTrack", {
                                      minLength: {
                                        value: 2,
                                        message: "Relative track must be at least 2 characters"
                                      },
                                      maxLength: {
                                        value: 50,
                                        message: "Relative track cannot exceed 50 characters"
                                      },
                                      pattern: {
                                        value: /^[a-zA-Z\s\-.']+$/,
                                        message: "Only letters, spaces, hyphens, periods and apostrophes are allowed"
                                      }
                                    })}
                                  />
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                            <Select
                              label="Horizontal Proximity Unit"
                              options={proximityUnitOptions}
                              error={errors.Horizontal_Proximity_Unit?.message}
                              {...register("Horizontal_Proximity_Unit")}
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
                              label="Vertical Proximity Unit"
                              options={verticalProximityUnitOptions}
                              error={errors.Vertical_Proximity_Unit?.message}
                              {...register("Vertical_Proximity_Unit")}
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
                              label="Avoidance Manoeuvre Needed?"
                              options={avoidanceManoeuvreOptions}
                              error={errors.Avoidance_manoeuvre_needed?.message}
                              {...register("Avoidance_manoeuvre_needed")}
                            />

                            <div>
                              <Select
                                label="Alert Received"
                                options={alertReceivedOptions}
                                error={errors.Alert_Received?.message}
                                {...register("Alert_Received")}
                              />

                              {/* Custom Alert Received Input - Shows when 'Other' is selected */}
                              {selectedAlertReceived === "Other" && (
                                <div className="mt-3">
                                  <Input
                                    label="Please specify alert type"
                                    placeholder="e.g., Visual warning"
                                    maxLength={50}
                                    error={errors.customAlertReceived?.message}
                                    {...register("customAlertReceived", {
                                      minLength: {
                                        value: 2,
                                        message: "Alert type must be at least 2 characters"
                                      },
                                      maxLength: {
                                        value: 50,
                                        message: "Alert type cannot exceed 50 characters"
                                      },
                                      pattern: {
                                        value: /^[a-zA-Z\s\-.']+$/,
                                        message: "Only letters, spaces, hyphens, periods and apostrophes are allowed"
                                      }
                                    })}
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <Select
                        label="Bird or animal Strike?"
                        options={yesNoOptions}
                        error={errors.Bird_or_Animal_Strike?.message}
                        {...register("Bird_or_Animal_Strike")}
                      />

                      {/* Bird/Animal Strike Section - Conditional */}
                      {didInvolveBirdAnimalStrike && (
                        <div className="mt-6 border-b border-gray-200 pb-8">
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
                              onKeyPress={(e) => {
                                // Only allow letters (a-z, A-Z) and spaces
                                if (!/[a-zA-Z ]/.test(e.key)) {
                                  e.preventDefault();
                                }
                              }}
                              {...register("Species", {
                                pattern: {
                                  value: validationPatterns.name,
                                  message: "Only letters and spaces are allowed"
                                },
                                minLength: { value: 2, message: validationMessages.minLength },
                                onChange: (e) => {
                                  // Remove any non-letter/space characters and convert to title case
                                  let value = e.target.value.replace(/[^a-zA-Z ]/g, '');
                                  e.target.value = toTitleCase(value);
                                }
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
                    </div>
                  </div>

                  <div className="mt-6">
                    <Select
                      label="In the vicinity of an aerodrome?"
                      options={yesNoOptions}
                      error={errors.In_vicinity_of_aerodrome?.message}
                      {...register("In_vicinity_of_aerodrome")}
                    />
                  </div>

                  {selectedAerodromeVicinity === "Yes" && (
                    <div className="mt-6">
                      <Input
                        label="Vicinity Aerodrome (Y Code)"
                        placeholder="Enter Y Code"
                        maxLength={50}
                        error={errors.Y_Code?.message}
                        helpText="If the occurrence was in vicinity of an aerodrome, enter the Y Code"
                        {...register("Y_Code")}
                      />
                    </div>
                  )}

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

                  {selectedDamageToAircraft !== "Nil" && (
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
                  )}

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
                          
                          // Trigger member validation if all fields are present
                          const firstName = value;
                          const memberNumber = watch("Maintainer_Member_Number");
                          const lastName = watch("Maintainer_Last_Name");
                          if (memberNumber && firstName && lastName) {
                            validateMaintainer(memberNumber, firstName, lastName);
                          }
                        }
                      })}
                    />

                    <div>
                      <Input
                        label="Maintainer Member Number"
                        placeholder="e.g. 123456"
                        maxLength={6}
                        helpText="Must be exactly 6 digits. If the maintainer was not a member, leave blank."
                        error={errors.Maintainer_Member_Number?.message}
                        onKeyPress={(e) => {
                          // Only allow numbers (0-9)
                          if (!/[0-9]/.test(e.key)) {
                            e.preventDefault();
                          }
                        }}
                        {...register("Maintainer_Member_Number", {
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
                            const memberNumber = e.target.value;
                            const firstName = watch("Maintainer_Name");
                            const lastName = watch("Maintainer_Last_Name");
                            if (memberNumber && firstName && lastName) {
                              validateMaintainer(memberNumber, firstName, lastName);
                            }
                          }
                        })}
                      />
                      {isValidatingMaintainer && (
                        <p className="mt-1 text-sm text-blue-600">Validating member number...</p>
                      )}
                      {maintainerValidationMessage && (
                        <p className={`mt-1 text-sm ${
                          maintainerValidationStatus === "valid" ? "text-green-600" : "text-red-600"
                        }`}>
                          {maintainerValidationMessage}
                        </p>
                      )}
                    </div>
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
                          
                          // Trigger member validation if all fields are present
                          const lastName = value;
                          const memberNumber = watch("Maintainer_Member_Number");
                          const firstName = watch("Maintainer_Name");
                          if (memberNumber && firstName && lastName) {
                            validateMaintainer(memberNumber, firstName, lastName);
                          }
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
                          <span className="flex items-center gap-1">
                            Accident
                            <span className="group relative inline-flex items-center">
                              <svg className="w-8 h-6 text-gray-700 cursor-help py-0.5 px-1 hover:bg-blue-50 rounded-full transition-all" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                              </svg>
                              <div className="invisible group-hover:visible absolute left-full ml-2 top-1/2 -translate-y-1/2 w-72 md:w-96 bg-white border-2 border-gray-500 rounded-lg shadow-xl z-50">
                                <div className="bg-gray-600 text-white font-semibold text-sm px-3 py-2 rounded-t-md">Accident Definition</div>
                                <div className="text-gray-900 text-sm leading-relaxed p-3">
                                  An occurrence where a person suffers serious or fatal injuries; or the aircraft sustains damage or structural failure which adversely affects the structural strength, performance or flight characteristics of the aircraft and would normally require major repair or replacement of the affected component.
                                </div>
                              </div>
                            </span>
                          </span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            value="Incident"
                            {...register("Accident_or_Incident", { required: "This field cannot be blank." })}
                            className="mr-2"
                          />
                          <span className="flex items-center gap-1">
                            Incident
                            <span className="group relative inline-flex items-center">
                              <svg className="w-8 h-6 text-gray-700 cursor-help py-0.5 px-1 hover:bg-blue-50 rounded-full transition-all" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                              </svg>
                              <div className="invisible group-hover:visible absolute left-full ml-2 top-1/2 -translate-y-1/2 w-72 md:w-96 bg-white border-2 border-gray-500 rounded-lg shadow-xl z-50">
                                <div className="bg-gray-600 text-white font-semibold text-sm px-3 py-2 rounded-t-md">Incident Definition</div>
                                <div className="text-gray-700 text-sm leading-relaxed p-3">
                                  Any occurrence, other than an accident, that is associated with the operation of an aircraft and affects, or could affect, the safety of the operation of the aircraft.
                                </div>
                              </div>
                            </span>
                          </span>
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
                          <span className="flex items-center gap-1">
                            Immediately reportable matter
                            <span className="group relative inline-flex items-center">
                              <svg className="w-8 h-6 text-gray-700 cursor-help py-0.5 px-1 hover:bg-blue-50 rounded-full transition-all" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                              </svg>
                              <div className="invisible group-hover:visible absolute left-full ml-2 top-1/2 -translate-y-1/2 w-72 md:w-96 bg-white border-2 border-gray-500 rounded-lg shadow-xl z-50">
                                <div className="bg-gray-600 text-white font-semibold text-sm px-3 py-2 rounded-t-md">Immediately Reportable Matter (IRM)</div>
                                <div className="text-gray-900 text-sm leading-relaxed p-3">
                                  An aircraft accident; or a loss of separation standards between two aircraft receiving an air navigation service provider (ANSP) separation service; or an occurrence resulting in serious damage to property outside the aircraft.
                                </div>
                              </div>
                            </span>
                          </span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            value="RRM"
                            {...register("ATSB_reportable_status", { required: "This field cannot be blank." })}
                            className="mr-2"
                          />
                          <span className="flex items-center gap-1">
                            Routinely reportable matter
                            <span className="group relative inline-flex items-center">
                              <svg className="w-8 h-6 text-gray-700 cursor-help py-0.5 px-1 hover:bg-blue-50 rounded-full transition-all" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                              </svg>
                              <div className="invisible group-hover:visible absolute left-full ml-2 top-1/2 -translate-y-1/2 w-72 md:w-96 bg-white border-2 border-gray-500 rounded-lg shadow-xl z-50">
                                <div className="bg-gray-600 text-white font-semibold text-sm px-3 py-2 rounded-t-md">Routinely Reportable Matter (RRM)</div>
                                <div className="text-gray-700 text-sm leading-relaxed p-3">
                                  A routinely reportable matter is a transport safety occurrence that has not had a serious outcome and does not require an immediate report, but where transport safety was affected or could have been affected.
                                </div>
                              </div>
                            </span>
                          </span>
                        </label>
                      </div>
                      {errors.ATSB_reportable_status && (
                        <p className="text-red-500 text-sm mt-1">{errors.ATSB_reportable_status.message}</p>
                      )}
                    </fieldset>
                  </div>

                  {selectedReportableStatus === "IRM" && (
                    <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-md">
                      <p className="text-red-700 font-semibold text-sm">
                        Immediately reportable matters are required to be notified to RAAus via phone as soon as practicable.
                        RAAus can be contacted on <a href="tel:+61262804700" className="text-red-700 underline">02 6280 4700</a>.
                      </p>
                    </div>
                  )}
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
                      onKeyPress={(e) => {
                        // Only allow letters (a-z, A-Z) and spaces
                        if (!/[a-zA-Z ]/.test(e.key)) {
                          e.preventDefault();
                        }
                      }}
                      {...register("Departure_location", {
                        pattern: {
                          value: validationPatterns.name,
                          message: "Only letters and spaces are allowed"
                        },
                        onChange: (e) => {
                          // Remove any non-letter/space characters and convert to title case
                          let value = e.target.value.replace(/[^a-zA-Z ]/g, '');
                          e.target.value = toTitleCase(value);
                        }
                      })}
                    />

                    <Input
                      label="Destination Location"
                      placeholder="Enter destination location"
                      maxLength={50}
                      error={errors.Destination_location?.message}
                      onKeyPress={(e) => {
                        // Only allow letters (a-z, A-Z) and spaces
                        if (!/[a-zA-Z ]/.test(e.key)) {
                          e.preventDefault();
                        }
                      }}
                      {...register("Destination_location", {
                        pattern: {
                          value: validationPatterns.name,
                          message: "Only letters and spaces are allowed"
                        },
                        onChange: (e) => {
                          // Remove any non-letter/space characters and convert to title case
                          let value = e.target.value.replace(/[^a-zA-Z ]/g, '');
                          e.target.value = toTitleCase(value);
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
                      onKeyPress={(e) => {
                        // Only allow letters (a-z, A-Z) and spaces
                        if (!/[a-zA-Z ]/.test(e.key)) {
                          e.preventDefault();
                        }
                      }}
                      {...register("Landing", {
                        pattern: {
                          value: validationPatterns.name,
                          message: "Only letters and spaces are allowed"
                        },
                        onChange: (e) => {
                          // Remove any non-letter/space characters and convert to title case
                          let value = e.target.value.replace(/[^a-zA-Z ]/g, '');
                          e.target.value = toTitleCase(value);
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
                      <div>
                        <SearchableDropdown
                          label="Name of Flight Training School"
                          required
                          options={flightTrainingSchoolOptions}
                          value={watch("Name_of_Flight_Training_School") || ""}
                          onChange={(value) => setValue("Name_of_Flight_Training_School", value)}
                          placeholder="Search and select flight training school..."
                          error={errors.Name_of_Flight_Training_School?.message}
                        />
                      </div>
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

                {/* Navigation Buttons */}
                <div className="flex justify-between pt-8 border-t border-gray-200">
                  <Button
                    type="button"
                    onClick={prevStep}
                    variant="outline"
                    className="px-8 py-2 bg-gray-200 border border-gray-400 text-gray-700 rounded-lg hover:bg-gray-300 hover:border-gray-500 hover:text-gray-900 focus:ring-2 focus:ring-gray-400 transition-all"
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
                      {...register('Serial_number', { 
                        required: 'Serial number is required',
                        minLength: { value: 3, message: validationMessages.minLength },
                        pattern: {
                          value: /^[a-zA-Z0-9 .\-]+$/,
                          message: "Serial number can only contain letters, numbers, spaces, dots, and hyphens"
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
                        type="number"
                        placeholder="103"
                        maxLength={10}
                        step="0.1"
                        min="0"
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
                  </div>
                </div>

                {/* Personal Locator Beacon Section */}
                <div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Select
                      label="Personal Locator Beacon carried"
                      required
                      options={plbOptions}
                      {...register('Personal_Locator_Beacon_carried', { required: 'PLB status is required' })}
                      error={errors.Personal_Locator_Beacon_carried?.message}
                    />
                    
                    <Select
                      label="PLB Activated"
                      options={yesNoOptions}
                      {...register('PLB_Activated')}
                      error={errors.PLB_Activated?.message}
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

                {/* ATSB Acknowledgement Checkbox */}
                <div className="mt-6">
                  <Checkbox
                    label="I acknowledge that my report will be submitted to the ATSB on my behalf in accordance with requirements under the TSI Act"
                    required
                    error={errors.atsbAcknowledgement?.message}
                    {...register("atsbAcknowledgement", {
                      required: "You must acknowledge that your report will be submitted to the ATSB"
                    })}
                  />
                </div>
                
                <div className="flex justify-between pt-8 border-t border-gray-200">
                  <Button
                    type="button"
                    onClick={prevStep}
                    variant="outline"
                    className="px-8 py-2 bg-gray-200 border border-gray-400 text-gray-700 rounded-lg hover:bg-gray-300 hover:border-gray-500 hover:text-gray-900 focus:ring-2 focus:ring-gray-400 transition-all"
                  >
                    Previous: Occurrence Information
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-green-500 hover:bg-green-600 text-white px-8 py-2"
                  >
                    Review & Submit
                  </Button>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
      </div>
    </FormProvider>
  );
}
