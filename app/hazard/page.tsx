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
import { HazardFormData } from "@/types/forms";
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

export default function HazardForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [memberValidationStatus, setMemberValidationStatus] = useState<"valid" | "invalid" | "">("");
  const [memberValidationMessage, setMemberValidationMessage] = useState("");
  const [isValidatingMember, setIsValidatingMember] = useState(false);
  const [hazardDate, setHazardDate] = useState("");
  const [hazardTime, setHazardTime] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [attachments, setAttachments] = useState<FileList | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<HazardFormData>();

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
      console.error("Member validation failed:", error);
      setMemberValidationStatus("invalid");
      setMemberValidationMessage("Unable to validate Member Number");
    } finally {
      setIsValidatingMember(false);
    }
  };

  const onSubmit = async (data: HazardFormData) => {
    setIsSubmitting(true);

    try {
      // Validate required fields
      if (!hazardDate || !hazardTime) {
        alert("Please provide both hazard date and time");
        setIsSubmitting(false);
        return;
      }

      // Convert date and time to ISO 8601 format
      const datetime = new Date(`${hazardDate}T${hazardTime}`);

      if (isNaN(datetime.getTime())) {
        alert("Invalid date or time provided");
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

      const fullHazardDate = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}+10:00`;

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
        Name: `${data.Name1} ${data.Last_Name}`, // Required combined name field
        Contact_Phone: contactPhone,
        Date_Hazard_Identified: fullHazardDate,
        Please_fully_describe_the_identified_hazard: data.Hazard_Description,
        Location_of_hazard: data.Location_of_Hazard,
        Potential_Consequences_of_Hazard: data.Prevention_Suggestions,
        Hazard: true, // Mark this as a hazard report
        attachmentLinks: attachmentLinks.join(", "),
      };

      console.log("Submitting hazard to CRM:", {
        module: "Occurrence_Management",
        data: crmData,
      });

      const response = await axios.post("/api/zoho-crm", {
        module: "Occurrence_Management",
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
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Hazard Report Submitted</h2>
          <p className="text-gray-600 mb-6">
            Your hazard report has been successfully submitted to RAAus. You will receive a confirmation email shortly.
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

        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">Lodge a New Hazard</h1>

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
                {...register("Role", { required: true })}
                error={errors.Role?.message}
              />

              <div>
                <Input
                  label="Member Number"
                  type="text"
                  placeholder="123456"
                  {...register("Member_Number", {
                    pattern: {
                      value: validationPatterns.memberNumber,
                      message: "Must be 5-6 digits",
                    },
                    onChange: (e) => {
                      const memberNumber = e.target.value;
                      const firstName = watch("Name1");
                      const lastName = watch("Last_Name");
                      if (memberNumber && firstName && lastName) {
                        validateMember(memberNumber, firstName, lastName);
                      } else {
                        setMemberValidationStatus("");
                        setMemberValidationMessage("");
                      }
                    },
                  })}
                  error={errors.Member_Number?.message}
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
                {...register("Name1", {
                  required: "First name is required",
                  pattern: {
                    value: validationPatterns.name,
                    message: "Must be 3-16 characters, letters, spaces, and hyphens only",
                  },
                  onChange: (e) => {
                    const firstName = e.target.value;
                    const memberNumber = watch("Member_Number");
                    const lastName = watch("Last_Name");
                    if (memberNumber && firstName && lastName) {
                      validateMember(memberNumber, firstName, lastName);
                    }
                  },
                })}
                error={errors.Name1?.message}
              />

              <Input
                label="Last Name"
                type="text"
                placeholder="Doe"
                required
                {...register("Last_Name", {
                  required: "Last name is required",
                  pattern: {
                    value: validationPatterns.name,
                    message: "Must be 3-16 characters, letters, spaces, and hyphens only",
                  },
                  onChange: (e) => {
                    const lastName = e.target.value;
                    const memberNumber = watch("Member_Number");
                    const firstName = watch("Name1");
                    if (memberNumber && firstName && lastName) {
                      validateMember(memberNumber, firstName, lastName);
                    }
                  },
                })}
                error={errors.Last_Name?.message}
              />

              <Input
                label="Email"
                type="email"
                placeholder="example@domain.com"
                {...register("Reporter_Email", {
                  pattern: {
                    value: validationPatterns.email,
                    message: "Please enter a valid email address",
                  },
                })}
                error={errors.Reporter_Email?.message}
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

          {/* Hazard Information Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Hazard Information</h2>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Date Hazard Identified"
                  type="date"
                  required
                  value={hazardDate}
                  onChange={(e) => setHazardDate(e.target.value)}
                  min="1875-01-01"
                  max="2025-10-06"
                />
                <Input
                  label="Time Hazard Identified"
                  type="time"
                  required
                  value={hazardTime}
                  onChange={(e) => setHazardTime(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  label="State"
                  required
                  options={stateOptions}
                  {...register("State", { required: true })}
                  error={errors.State?.message}
                />
              </div>

              <Textarea
                label="Location of Hazard"
                required
                rows={3}
                {...register("Location_of_Hazard", { required: "Location of hazard is required" })}
                error={errors.Location_of_Hazard?.message}
              />

              <Textarea
                label="Please Fully Describe the Identified Hazard"
                required
                rows={4}
                {...register("Hazard_Description", { required: "Hazard description is required" })}
                error={errors.Hazard_Description?.message}
              />

              <Textarea
                label="Do You Have Further Suggestions on How to Prevent Similar Occurrences?"
                rows={3}
                {...register("Prevention_Suggestions")}
                error={errors.Prevention_Suggestions?.message}
              />

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-sm text-blue-800">
                  Immediately reportable matters are required to be notified to RAAus via phone as soon as practicable. 
                  RAAus can be contacted on 02 6280 4700.
                </p>
              </div>

              <FileUpload
                label="Attachments"
                description="Upload photos and videos as evidence. Additionally include engine, propeller and airframe maintenance inspection documentation from logbooks as it pertains to the report."
                onChange={setAttachments}
                maxFiles={5}
                maxSize={256}
              />
            </div>
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