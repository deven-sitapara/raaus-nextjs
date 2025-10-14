"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { PhoneInput } from "@/components/ui/PhoneInput";
import { DatePicker } from "@/components/ui/DatePicker";
import { FileUpload } from "@/components/ui/FileUpload";
import { Button } from "@/components/ui/Button";
import { DefectFormData } from "@/types/forms";
import { validationPatterns, validationMessages, validateEmail, validatePhoneNumber, getPhoneValidationMessage } from "@/lib/validations/patterns";
import { useFormPersistence, useSpecialStatePersistence, clearFormOnSubmission } from "@/lib/utils/formPersistence";
import DefectPreview from "@/components/forms/DefectPreview";
import axios from "axios";
import Link from "next/link";
import "./defect-style.css";

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submissionData, setSubmissionData] = useState<any>(null);
  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);
  const [memberValidationStatus, setMemberValidationStatus] = useState<"valid" | "invalid" | "">("");
  const [memberValidationMessage, setMemberValidationMessage] = useState("");
  const [isValidatingMember, setIsValidatingMember] = useState(false);
  
  // Maintainer validation states
  const [maintainerValidationStatus, setMaintainerValidationStatus] = useState<"valid" | "invalid" | "">("");
  const [maintainerValidationMessage, setMaintainerValidationMessage] = useState("");
  const [isValidatingMaintainer, setIsValidatingMaintainer] = useState(false);
  const [defectDate, setDefectDate] = useState("");
  const [defectTime, setDefectTime] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [attachments, setAttachments] = useState<FileList | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState<DefectFormData | null>(null);

  // Aircraft lookup states
  const [isLookingUpAircraft, setIsLookingUpAircraft] = useState(false);
  const [aircraftLookupStatus, setAircraftLookupStatus] = useState<"success" | "error" | "">("");
  const [aircraftLookupMessage, setAircraftLookupMessage] = useState("");

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<DefectFormData>();

  // Watch role for "Other" option
  const selectedRole = watch("role");

  // Form persistence
  const { clearCurrentForm } = useFormPersistence(
    { formType: 'defect' }, 
    watch, 
    setValue, 
    reset
  );

  // Special state persistence
  const { clearSpecialState } = useSpecialStatePersistence(
    'defect',
    undefined,
    { defectDate, defectTime, contactPhone },
    {
      defectDate: setDefectDate,
      defectTime: setDefectTime,
      contactPhone: setContactPhone
    }
  );

  // Watch registration fields for aircraft lookup
  const registrationPrefix = watch("registrationNumberPrefix");
  const registrationSuffix = watch("registrationNumberSuffix");

  // Auto-lookup aircraft when both prefix and suffix are provided
  useEffect(() => {
    if (registrationPrefix && registrationSuffix) {
      // Debounce the lookup to avoid excessive API calls
      const timeoutId = setTimeout(() => {
        lookupAircraft(registrationPrefix, registrationSuffix);
      }, 500);
      
      return () => clearTimeout(timeoutId);
    } else {
      // Clear aircraft lookup status when fields are empty
      setAircraftLookupStatus("");
      setAircraftLookupMessage("");
    }
  }, [registrationPrefix, registrationSuffix]);

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

  // Validate member number with immediate feedback
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
  const lookupAircraft = async (registrationPrefix: string, registrationSuffix: string) => {
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
      });

      if (response.data.success && response.data.data) {
        const aircraftData = response.data.data;
        
        // Auto-fill aircraft fields
        setValue("serialNumber", aircraftData.Serial_Number1 || "");
        setValue("make", aircraftData.Manufacturer || "");
        setValue("model", aircraftData.Model || "");
        setValue("registrationStatus", aircraftData.Registration_Type || "");
        setValue("type", aircraftData.Type || "");
        setValue("yearBuilt", aircraftData.Year_Built1 || aircraftData.Manufacturer_Date || "");
        
        // Auto-fill engine fields
        setValue("engineMake", aircraftData.Engine_Details || "");
        setValue("engineModel", aircraftData.Engine_model || "");
        setValue("engineSerial", aircraftData.Engines_Serial || "");
        
        // Auto-fill propeller fields
        setValue("propellerMake", aircraftData.Propeller_make || "");
        setValue("propellerModel", aircraftData.Propeller_model || "");
        setValue("propellerSerial", aircraftData.Propeller_serial || "");

        let fieldsPopulated = 0;
        const aircraftFields = ["serialNumber", "make", "model", "registrationStatus", "type", "yearBuilt"];
        const engineFields = ["engineMake", "engineModel", "engineSerial"];
        const propellerFields = ["propellerMake", "propellerModel", "propellerSerial"];
        
        aircraftFields.forEach(field => {
          const apiField = field === "serialNumber" ? "Serial_Number1" : 
                          field === "make" ? "Manufacturer" :
                          field === "model" ? "Model" :
                          field === "registrationStatus" ? "Registration_Type" :
                          field === "type" ? "Type" :
                          field === "yearBuilt" ? "Year_Built1" : field;
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

  const handlePreview = (data: DefectFormData) => {
    // Validate required fields before showing preview
    if (!defectDate || !defectTime) {
      alert("Please provide both defect date and time");
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
      
      // Validate required fields
      if (!defectDate || !defectTime) {
        alert("Please provide both defect date and time");
        setIsSubmitting(false);
        return;
      }

      if (!contactPhone) {
        alert("Please provide a contact phone number");
        setIsSubmitting(false);
        return;
      }

      // Convert date and time to ISO format
      const datetime = new Date(`${defectDate}T${defectTime}`);
      if (isNaN(datetime.getTime())) {
        alert("Invalid date or time provided");
        setIsSubmitting(false);
        return;
      }

      // Prepare form data for unified API
      const formData = new FormData();
      
      // Add form type and data
      formData.append('formType', 'defect');
      
      const submissionData = {
        // Map to CRM field names for consistency
        Role: data.role === "Other" && data.customRole?.trim() ? data.customRole.trim() : data.role,
        Name1: data.firstName,
        Member_Number: data.memberNumber,
        Reporter_First_Name: data.firstName,
        Reporter_Email: data.email,
        Contact_Phone: contactPhone,
        Last_Name: data.lastName,
        Occurrence_Date1: datetime.toISOString().slice(0, 19), // YYYY-MM-DDTHH:mm:ss format
        Location_of_aircraft_when_defect_was_found: data.locationOfAircraft,
        Location: data.locationOfAircraft,
        State: data.state,
        Description_of_Occurrence: data.defectDescription,
        Defective_component: data.defectiveComponent,
        Provide_description_of_defect: data.defectDescription,
        
        // Maintainer Information
        Maintainer_Name: data.Maintainer_Name || '',
        Maintainer_Last_Name: data.Maintainer_Last_Name || '',
        Maintainer_Member_Number: data.maintainerMemberNumber,
        Maintainer_Level: data.maintainerLevel,
        Do_you_have_further_suggestions_on_how_to_PSO: data.preventionSuggestions,
        Reporter_Suggestions: data.preventionSuggestions,
        
        // Aircraft Information
        Registration_number: data.registrationNumberPrefix && data.registrationNumberSuffix ? 
          `${data.registrationNumberPrefix}-${data.registrationNumberSuffix}` : '',
        Registration_status: data.registrationStatus,
        Serial_number: data.serialNumber,
        Make: data.make,
        Model: data.model,
        Type1: data.type,
        Year_Built1: data.yearBuilt,
        
        // Engine Details
        Engine_Details: data.engineMake, // Map engineMake to Engine_Details
        Engine_model: data.engineModel,
        Engine_serial: data.engineSerial,
        Total_engine_hours: data.totalEngineHours,
        Total_hours_since_service: data.totalHoursSinceService,
        
        // Propeller Details
        Propeller_make: data.propellerMake,
        Propeller_model: data.propellerModel,
        Propeller_serial: data.propellerSerial,
        
        // Legacy aliases for backward compatibility (only non-conflicting keys)
        contactPhone: contactPhone,
        dateDefectIdentified: datetime.toISOString().slice(0, 19),
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
        clearFormOnSubmission('defect');
        setShowPreview(false);
        setSubmitSuccess(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        throw new Error(response.data.error || "Failed to process defect report");
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
          formType: "defect",
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
      link.setAttribute("download", `Defect_Report_${submissionData.metadata?.occurrenceId || 'submission'}.pdf`);
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

  // Show preview screen
  if (showPreview && previewData) {
    return (
      <DefectPreview
        data={previewData}
        defectDate={defectDate}
        defectTime={defectTime}
        contactPhone={contactPhone}
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
            <h2 className="text-xl font-semibold text-gray-900 mb-6 border-b-2 border-gray-300 pb-4">
              Person Reporting

              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  clearCurrentForm();
                  clearSpecialState();
                  setAttachments(null);
                }}
                className="bg-red-50 float-right inline -top-6 relative text-red-600 border-red-200 hover:bg-red-100"
              >
                Clear Form
              </Button>
            </h2>

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
                      
                      const memberNumber = e.target.value;
                      const firstName = watch("firstName");
                      const lastName = watch("lastName");
                      if (memberNumber && firstName && lastName) {
                        validateMember(memberNumber, firstName, lastName);
                      } else {
                        setMemberValidationStatus("");
                        setMemberValidationMessage("");
                      }
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
                    
                    const firstName = value;
                    const memberNumber = watch("memberNumber");
                    const lastName = watch("lastName");
                    if (memberNumber && firstName && lastName) {
                      validateMember(memberNumber, firstName, lastName);
                    }
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
                    
                    const lastName = value;
                    const memberNumber = watch("memberNumber");
                    const firstName = watch("firstName");
                    if (memberNumber && firstName && lastName) {
                      validateMember(memberNumber, firstName, lastName);
                    }
                  },
                })}
                error={errors.lastName?.message}
              />

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
                defaultCountry="AU"
                countries={["AU", "CA", "GB"]}
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
                      
                      // Trigger member validation if all fields are present
                      const firstName = e.target.value.trim();
                      const lastName = watch("Maintainer_Last_Name");
                      const memberNumber = watch("maintainerMemberNumber");
                      if (memberNumber && firstName && lastName) {
                        validateMaintainer(memberNumber, firstName, lastName);
                      }
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
                      
                      // Trigger member validation if all fields are present
                      const firstName = watch("Maintainer_Name");
                      const lastName = e.target.value.trim();
                      const memberNumber = watch("maintainerMemberNumber");
                      if (memberNumber && firstName && lastName) {
                        validateMaintainer(memberNumber, firstName as string, lastName);
                      }
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
                        const memberNumber = e.target.value;
                        const firstName = watch("Maintainer_Name");
                        const lastName = watch("Maintainer_Last_Name");
                        if (memberNumber && firstName && lastName) {
                          validateMaintainer(memberNumber, firstName as string, lastName as string);
                        }
                      }
                    })}
                    error={errors.maintainerMemberNumber?.message}
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
                  {...register("yearBuilt", { required: "Year built is required" })}
                  error={errors.yearBuilt?.message}
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
              maxFiles={5}
              maxSize={256}
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4 px-6 pb-8">
            <Button type="button" variant="outline" onClick={() => (window.location.href = "/")}>
              Cancel
            </Button>
            <Button type="submit">
              Review & Submit
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
