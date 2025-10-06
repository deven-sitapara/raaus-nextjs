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
  const [memberWarning, setMemberWarning] = useState("");
  const [defectDate, setDefectDate] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [attachments, setAttachments] = useState<FileList | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<DefectFormData>();

  // Validate member number
  const validateMember = async (memberNumber: string, firstName: string, lastName: string) => {
    if (!memberNumber || !firstName || !lastName) return;

    try {
      const response = await axios.post("/api/validate-member", {
        memberNumber,
        firstName,
        lastName,
      });

      if (!response.data.valid && response.data.warning) {
        setMemberWarning(response.data.warning);
      } else {
        setMemberWarning("");
      }
    } catch (error) {
      console.error("Member validation failed:", error);
    }
  };

  const onSubmit = async (data: DefectFormData) => {
    setIsSubmitting(true);

    try {
      // Validate required fields
      if (!defectDate) {
        alert("Please provide the defect identification date");
        setIsSubmitting(false);
        return;
      }

      // Convert date to ISO 8601 format for Zoho CRM
      const datetime = new Date(`${defectDate}T12:00:00`);

      // Check if date is valid
      if (isNaN(datetime.getTime())) {
        alert("Invalid date provided");
        setIsSubmitting(false);
        return;
      }

      // Format as YYYY-MM-DDTHH:mm:ss+10:00 (Australia timezone)
      const year = datetime.getFullYear();
      const month = String(datetime.getMonth() + 1).padStart(2, '0');
      const day = String(datetime.getDate()).padStart(2, '0');
      const hours = String(datetime.getHours()).padStart(2, '0');
      const minutes = String(datetime.getMinutes()).padStart(2, '0');
      const seconds = String(datetime.getSeconds()).padStart(2, '0');

      const fullDefectDate = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}+10:00`;

      // Upload attachments if any
      let attachmentLinks: string[] = [];
      if (attachments && attachments.length > 0) {
        const formData = new FormData();
        Array.from(attachments).forEach((file) => {
          formData.append("files", file);
        });

        const uploadResponse = await axios.post("/api/zoho-workdrive", formData);
        attachmentLinks = uploadResponse.data.links || [];
      }

      // Submit to Zoho CRM
      const crmData = {
        ...data,
        Name: `${data.firstName} ${data.lastName}`, // Required combined name field
        Contact_Phone: contactPhone,
        Date_Defect_Identified: fullDefectDate,
        attachmentLinks: attachmentLinks.join(", "),
      };

      console.log("Submitting Defect to CRM:", {
        module: "Defect_Reports",
        data: crmData,
        dateDebug: {
          defectDate,
          iso: fullDefectDate
        }
      });

      const response = await axios.post("/api/zoho-crm", {
        module: "Defect_Reports",
        data: crmData,
      });

      console.log("CRM Response:", response.data);

      // Only show success if we get a record ID from CRM
      if (response.data?.data?.[0]?.code === "SUCCESS" && response.data?.data?.[0]?.details?.id) {
        setSubmitSuccess(true);
      } else {
        const errorDetails = response.data?.data?.[0];
        console.error("CRM Error:", errorDetails);
        throw new Error(errorDetails?.message || "Failed to create record");
      }
    } catch (error: any) {
      console.error("Submission failed:", error);
      console.error("Error response:", error.response?.data);
      const errorMessage = error.response?.data?.data?.[0]?.message || error.message || "Failed to submit form. Please try again.";
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

              <Input
                label="Member Number"
                type="text"
                placeholder="123456"
                {...register("memberNumber", {
                  pattern: {
                    value: validationPatterns.memberNumber,
                    message: "Must be 5-6 digits",
                  },
                  onBlur: (e) => {
                    const firstName = watch("firstName");
                    const lastName = watch("lastName");
                    validateMember(e.target.value, firstName, lastName);
                  },
                })}
                error={errors.memberNumber?.message}
              />

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

            {memberWarning && (
              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-sm text-yellow-800">{memberWarning}</p>
              </div>
            )}
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
