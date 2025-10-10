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
import { HazardFormData } from "@/types/forms";
import { validationPatterns } from "@/lib/validations/patterns";
import { useFormPersistence, useSpecialStatePersistence, clearFormOnSubmission } from "@/lib/utils/formPersistence";
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
  const [submissionData, setSubmissionData] = useState<any>(null);
  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);
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
    setValue,
    reset,
    formState: { errors },
  } = useForm<HazardFormData>();

  // Form persistence
  const { clearCurrentForm } = useFormPersistence(
    { formType: 'hazard' }, 
    watch, 
    setValue, 
    reset
  );

  // Special state persistence
  const { clearSpecialState } = useSpecialStatePersistence(
    'hazard',
    undefined,
    { hazardDate, hazardTime, contactPhone },
    {
      hazardDate: setHazardDate,
      hazardTime: setHazardTime,
      contactPhone: setContactPhone
    }
  );

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

  const onSubmit = async (data: HazardFormData) => {
    setIsSubmitting(true);

    try {
      // Validate required fields
      if (!hazardDate || !hazardTime) {
        alert("Please provide both hazard date and time");
        setIsSubmitting(false);
        return;
      }

      if (!contactPhone) {
        alert("Please provide a contact phone number");
        setIsSubmitting(false);
        return;
      }

      // Convert date and time to ISO format
      const datetime = new Date(`${hazardDate}T${hazardTime}`);
      if (isNaN(datetime.getTime())) {
        alert("Invalid date or time provided");
        setIsSubmitting(false);
        return;
      }

      // Prepare form data for unified API
      const formData = new FormData();
      
      // Add form type and data
      formData.append('formType', 'hazard');
      
      const submissionData = {
        ...data,
        Role: data.Role,
        Name1: data.Name1,
        Last_Name: data.Last_Name,
        Member_Number: data.Member_Number,
        Reporter_Email: data.Reporter_Email,
        Contact_Phone: contactPhone,
        Date_Hazard_Identified: datetime.toISOString().slice(0, 19),
        Occurrence_Date1: datetime.toISOString().slice(0, 19), // Also map to generic occurrence date
        Location_of_Hazard: data.Location_of_Hazard,
        Location: data.Location_of_Hazard, // Map to generic location field
        State: data.State,
        Hazard_Description: data.Hazard_Description,
        Please_fully_describe_the_identified_hazard: data.Hazard_Description,
        Description_of_Occurrence: data.Hazard_Description, // Map to generic description field
        Do_you_have_further_suggestions_on_how_to_PSO: data.Do_you_have_further_suggestions_on_how_to_PSO,
        Reporter_Suggestions: data.Do_you_have_further_suggestions_on_how_to_PSO, // Map to generic suggestions field
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
        clearFormOnSubmission('hazard');
        setSubmitSuccess(true);
      } else {
        throw new Error(response.data.error || "Failed to process hazard report");
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
          formType: "hazard",
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
      link.setAttribute("download", `Hazard_Report_${submissionData.metadata?.occurrenceId || 'submission'}.pdf`);
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
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Hazard Report Submitted</h2>
          <p className="text-gray-600 mb-4">
            Your hazard report has been successfully submitted to RAAus. You will receive a confirmation email shortly.
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

        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Lodge a New Hazard</h1>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              clearCurrentForm();
              clearSpecialState();
              setAttachments(null);
            }}
            className="bg-red-50 text-red-600 border-red-200 hover:bg-red-100"
          >
            Clear Form
          </Button>
        </div>

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
                required
                {...register("Reporter_Email", {
                  required: "Email is required",
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date Hazard Identified <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={hazardDate}
                    onChange={(e) => {
                      const selectedDateStr = e.target.value;
                      const selectedDate = new Date(selectedDateStr + 'T00:00:00');
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      
                      // Only block if selected date is AFTER today
                      if (selectedDate.getTime() > today.getTime()) {
                        alert("Hazard identification date cannot be in the future");
                        return;
                      }
                      
                      setHazardDate(selectedDateStr);
                    }}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="1900-01-01"
                    max={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Time Hazard Identified <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    value={hazardTime}
                    onChange={(e) => {
                      const selectedTime = e.target.value;
                      
                      // If today's date is selected, validate time is not in the future
                      if (hazardDate) {
                        const selectedDate = new Date(hazardDate + 'T00:00:00');
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        
                        // If hazard date is today
                        if (selectedDate.getTime() === today.getTime()) {
                          const [hours, minutes] = selectedTime.split(':');
                          const currentHours = new Date().getHours();
                          const currentMinutes = new Date().getMinutes();
                          
                          if (parseInt(hours) > currentHours || 
                              (parseInt(hours) === currentHours && parseInt(minutes) > currentMinutes)) {
                            alert("Hazard identification time cannot be in the future");
                            return;
                          }
                        }
                      }
                      
                      setHazardTime(e.target.value);
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
                {...register("Do_you_have_further_suggestions_on_how_to_PSO")}
                error={errors.Do_you_have_further_suggestions_on_how_to_PSO?.message}
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
                multiple
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