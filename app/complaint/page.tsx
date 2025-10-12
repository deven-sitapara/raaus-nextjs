"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { PhoneInput } from "@/components/ui/PhoneInput";
import { DatePicker } from "@/components/ui/DatePicker";
import { FileUpload } from "@/components/ui/FileUpload";
import { Checkbox } from "@/components/ui/Checkbox";
import { Button } from "@/components/ui/Button";
import { ComplaintFormData } from "@/types/forms";
import { validationPatterns, validationMessages, validateEmail, validatePhoneNumber, getPhoneValidationMessage } from "@/lib/validations/patterns";
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

export default function ComplaintForm() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submissionData, setSubmissionData] = useState<any>(null);
  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);
  const [memberValidationStatus, setMemberValidationStatus] = useState<"valid" | "invalid" | "">("");
  const [memberValidationMessage, setMemberValidationMessage] = useState("");
  const [isValidatingMember, setIsValidatingMember] = useState(false);
  const [occurrenceDate, setOccurrenceDate] = useState("");
  const [occurrenceTime, setOccurrenceTime] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [attachments, setAttachments] = useState<FileList | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<ComplaintFormData>();

  // Form persistence
  const { clearCurrentForm } = useFormPersistence(
    { formType: 'complaint' }, 
    watch, 
    setValue, 
    reset
  );

  // Special state persistence
  const { clearSpecialState } = useSpecialStatePersistence(
    'complaint',
    undefined,
    { occurrenceDate, occurrenceTime, contactPhone },
    {
      occurrenceDate: setOccurrenceDate,
      occurrenceTime: setOccurrenceTime,
      contactPhone: setContactPhone
    }
  );

  const wishToRemainAnonymous = watch("wishToRemainAnonymous");

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

  const onSubmit = async (data: ComplaintFormData) => {
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
      formData.append('formType', 'complaint');
      
      const submissionData = {
        ...data,
        Role: data.Role,
        Name1: data.Name1,
        Last_Name: data.Last_Name,
        Member_Number: data.Member_Number,
        Reporter_Email: data.Reporter_Email,
        Contact_Phone: contactPhone,
        Occurrence_Date1: datetime.toISOString().slice(0, 19), // YYYY-MM-DDTHH:mm:ss format
        Description_of_Occurrence: data.Description_of_Occurrence,
        wishToRemainAnonymous: data.wishToRemainAnonymous,
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
        clearFormOnSubmission('complaint');
        setSubmitSuccess(true);
        setSubmissionData(response.data);
      } else {
        throw new Error(response.data.error || "Failed to process complaint");
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
      const response = await axios.post("/api/generate-pdf", {
        formType: submissionData.formType,
        formData: submissionData.formData,
        metadata: submissionData.metadata,
      }, {
        responseType: 'blob',
      });

      // Create blob from response
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      
      // Create download link
      const link = document.createElement('a');
      link.href = url;
      link.download = `RAAus_Complaint_Report_${submissionData.metadata?.occurrenceId || Date.now()}.pdf`;
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error('PDF download error:', error);
      alert('Failed to download PDF. Please try again.');
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
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Complaint Submitted</h2>
          <p className="text-gray-600 mb-6">
            Your complaint has been successfully submitted to RAAus. You will receive a confirmation email shortly.
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
              variant="primary"
            >
              {isDownloadingPDF ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generating PDF...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download PDF Copy
                </>
              )}
            </Button>
            <Button onClick={() => (window.location.href = "/")} variant="outline" className="w-full">
              Return to Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
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

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 text-center w-full mb-6">Lodge a New Complaint</h1>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 border border-gray-300 rounded-lg shadow-lg bg-white ">
          {/* Person Reporting Section */}
          <div className="rounded-lg p-8 pt-10">
            <h2 className="text-xl font-semibold text-gray-900 mb-8 border-b-2 border-gray-300 pb-4">
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
                  maxLength={6}
                  onKeyPress={(e) => {
                    // Only allow numbers (0-9)
                    if (!/[0-9]/.test(e.key)) {
                      e.preventDefault();
                    }
                  }}
                  {...register("Member_Number", {
                    pattern: {
                      value: validationPatterns.memberNumber,
                      message: validationMessages.memberNumber,
                    },
                    onChange: (e) => {
                      // Remove any non-numeric characters
                      e.target.value = e.target.value.replace(/[^0-9]/g, '');
                      
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
                maxLength={30}
                onKeyPress={(e) => {
                  // Only allow letters (a-z, A-Z) and spaces
                  if (!/[a-zA-Z ]/.test(e.key)) {
                    e.preventDefault();
                  }
                }}
                {...register("Name1", {
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
                maxLength={30}
                onKeyPress={(e) => {
                  // Only allow letters (a-z, A-Z) and spaces
                  if (!/[a-zA-Z ]/.test(e.key)) {
                    e.preventDefault();
                  }
                }}
                {...register("Last_Name", {
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
                  validate: (value) => {
                    if (!value || !validateEmail(value)) {
                      return "Please enter a valid email address (e.g., user@example.com)";
                    }
                    return true;
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

          {/* Complaint Information Section */}
          <div className="bg-white rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Complaint Information</h2>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        alert("Occurrence date cannot be in the future");
                        return;
                      }
                      
                      setOccurrenceDate(selectedDateStr);
                    }}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="1900-01-01"
                    max={new Date().toISOString().split('T')[0]}
                    required
                  />
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
                      
                      // If today's date is selected, validate time is not in the future
                      if (occurrenceDate) {
                        const selectedDate = new Date(occurrenceDate + 'T00:00:00');
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        
                        // If occurrence date is today
                        if (selectedDate.getTime() === today.getTime()) {
                          const [hours, minutes] = selectedTime.split(':');
                          const currentHours = new Date().getHours();
                          const currentMinutes = new Date().getMinutes();
                          
                          if (parseInt(hours) > currentHours || 
                              (parseInt(hours) === currentHours && parseInt(minutes) > currentMinutes)) {
                            alert("Occurrence time cannot be in the future");
                            return;
                          }
                        }
                      }
                      
                      setOccurrenceTime(e.target.value);
                    }}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <Textarea
                label="Complaint Details"
                required
                rows={6}
                {...register("Description_of_Occurrence", { required: "Complaint details are required" })}
                error={errors.Description_of_Occurrence?.message}
              />

              <div className="divider-h-6 h-6 w-full"></div>

              <FileUpload
                label="Attachments"
                description="Upload photos and videos as evidence. Additionally include engine, propeller and airframe maintenance inspection documentation from logbooks as it pertains to the report."
                multiple
                onChange={setAttachments}
                maxFiles={5}
                maxSize={256}
              />

              <div className="divider-h-4 p-4 w-full">
                <Checkbox
                  label="Do you wish to remain anonymous?"
                  {...register("wishToRemainAnonymous")}
                />                
              </div>

              {wishToRemainAnonymous && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-sm text-blue-800">
                    Reporter details will remain confidential from the complainant unless otherwise
                    authorised. Reporters are encouraged to provide their details so that RAAus may
                    make contact to obtain further information and ascertain validity of the
                    complaint. Where information is provided anonymously, however, it may not be
                    possible for us to obtain further important details about the matter reported.
                    This may result in the inability for RAAus to progress any review of the
                    complaint provided.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4 mr-8 mb-8">
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
