"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { PhoneInput } from "@/components/ui/PhoneInput";
import { DatePicker } from "@/components/ui/DatePicker";
import { FileUpload } from "@/components/ui/FileUpload";
import { Button } from "@/components/ui/Button";
import { DefectFormData } from "@/types/forms";
import { validationPatterns } from "@/lib/validations/patterns";
import axios from "axios";
import Link from "next/link";

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
  const [memberValidationStatus, setMemberValidationStatus] = useState<"valid" | "invalid" | "">("");
  const [memberValidationMessage, setMemberValidationMessage] = useState("");
  const [isValidatingMember, setIsValidatingMember] = useState(false);
  const [defectDate, setDefectDate] = useState("");
  const [defectTime, setDefectTime] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [attachments, setAttachments] = useState<FileList | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<DefectFormData>();

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

  const onSubmit = async (data: DefectFormData) => {
    setIsSubmitting(true);

    try {
      // Validate required fields
      if (!defectDate || !defectTime) {
        alert("Please provide both defect date and time");
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
        Role: data.role,
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
        Maintainer_Name: data.maintainerName,
        Maintainer_Member_Number: data.maintainerMemberNumber,
        Maintainer_Level: data.maintainerLevel,
        Do_you_have_further_suggestions_on_how_to_PSO: data.preventionSuggestions,
        
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
        setSubmitSuccess(true);
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
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Defect Report Submitted</h2>
          <p className="text-gray-600 mb-6">
            Your defect report has been successfully submitted to RAAus. You will receive a confirmation email shortly.
          </p>
          <Button onClick={() => (window.location.href = "/")}>Return to Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
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

        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">Lodge a New Defect</h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Person Reporting Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 border-b-2 border-gray-300 pb-2">
              Person Reporting
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Role"
                required
                options={roleOptions}
                {...register("role", { required: "Role is required" })}
                error={errors.role?.message}
              />

              <div>
                <Input
                  label="Member Number"
                  type="text"
                  placeholder="123456"
                  {...register("memberNumber", {
                    pattern: {
                      value: validationPatterns.memberNumber,
                      message: "Must be 5-6 digits",
                    },
                    onChange: (e) => {
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
                {...register("firstName", {
                  required: "First name is required",
                  pattern: {
                    value: validationPatterns.name,
                    message: "Must be 3-16 characters, letters, spaces, and hyphens only",
                  },
                  onChange: (e) => {
                    const firstName = e.target.value;
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
                {...register("lastName", {
                  required: "Last name is required",
                  pattern: {
                    value: validationPatterns.name,
                    message: "Must be 3-16 characters, letters, spaces, and hyphens only",
                  },
                  onChange: (e) => {
                    const lastName = e.target.value;
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
                {...register("email", {
                  pattern: {
                    value: validationPatterns.email,
                    message: "Please enter a valid email address",
                  },
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
            </div>
          </div>

          {/* Defect Information Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 border-b-2 border-gray-300 pb-2">
              Defect Information
            </h2>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Date Defect Identified"
                  type="date"
                  required
                  value={defectDate}
                  onChange={(e) => setDefectDate(e.target.value)}
                  min="1875-01-01"
                  max={new Date().toISOString().split('T')[0]}
                />

            <Input
                  label="Time Hazard Identified"
                  type="time"
                  required
                  value={defectTime}
                  onChange={(e) => setDefectTime(e.target.value)}
                />

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
                  label="Maintainer Name"
                  type="text"
                  placeholder="Robert Johnson"
                  {...register("maintainerName", {
                    pattern: {
                      value: /^[a-zA-Z\s]*$/,
                      message: "Letters and spaces only",
                    },
                  })}
                  error={errors.maintainerName?.message}
                />

                <Input
                  label="Maintainer Member Number"
                  type="text"
                  placeholder="e.g. 6789"
                  {...register("maintainerMemberNumber", {
                    pattern: {
                      value: validationPatterns.memberNumber,
                      message: "Must be 5-6 digits",
                    },
                  })}
                  error={errors.maintainerMemberNumber?.message}
                />
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
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 border-b-2 border-gray-300 pb-2">
              Aircraft Information
            </h2>

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
                  {...register("registrationNumberSuffix", {
                    required: "Registration suffix is required",
                    minLength: { value: 4, message: "Must be exactly 4 digits" },
                    maxLength: { value: 4, message: "Must be exactly 4 digits" },
                    pattern: { value: /^\d{4}$/, message: "Must be 4 digits" },
                  })}
                  error={errors.registrationNumberSuffix?.message}
                />

                <Input
                  label="Serial Number"
                  type="text"
                  required
                  {...register("serialNumber", { required: "Serial number is required" })}
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
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 border-b-2 border-gray-300 pb-2">
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
                  type="text"
                  placeholder="200"
                  {...register("totalEngineHours", {
                    pattern: { value: /^\d+$/, message: "Numbers only" },
                  })}
                  error={errors.totalEngineHours?.message}
                />

                <Input
                  label="Total Hours Since Service"
                  type="text"
                  placeholder="102"
                  {...register("totalHoursSinceService", {
                    pattern: { value: /^\d+$/, message: "Numbers only" },
                  })}
                  error={errors.totalHoursSinceService?.message}
                />
              </div>
            </div>
          </div>

          {/* Propeller Details Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 border-b-2 border-gray-300 pb-2">
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
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 border-b-2 border-gray-300 pb-2">
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
          <div className="flex justify-end space-x-4">
            <Button type="button" variant="outline" onClick={() => (window.location.href = "/")}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
