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
import SearchableDropdown from "@/components/ui/SearchableDropdown";
import MapPicker from "@/components/ui/MapPicker";
import { HazardFormData } from "@/types/forms";
import { validationPatterns, validationMessages } from "@/lib/validations/patterns";
import { useFormPersistence, useSpecialStatePersistence, clearFormOnSubmission } from "@/lib/utils/formPersistence";
import HazardPreview from "@/components/forms/HazardPreview";
import axios from "axios";
import Link from "next/link";
import './hazard-style.css';

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
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState<HazardFormData | null>(null);
  const [aerodromes, setAerodromes] = useState<string[]>([]);
  const [selectedAerodrome, setSelectedAerodrome] = useState("");
  const [loadingAerodromes, setLoadingAerodromes] = useState(true);
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<HazardFormData>();

  // Watch for "Other" option selections
  const selectedRole = watch("role");
  const hazardRelatesToAerodrome = watch("hazardRelatesToSpecificAerodrome");

  // Form persistence
  const { clearCurrentForm } = useFormPersistence(
    { formType: 'hazard' }, 
    watch, 
    setValue, 
    reset
  );

  // Special state persistence (includes aerodrome selection and coordinates)
  const { clearSpecialState } = useSpecialStatePersistence(
    'hazard',
    undefined,
    { hazardDate, hazardTime, contactPhone, selectedAerodrome, latitude, longitude },
    {
      hazardDate: setHazardDate,
      hazardTime: setHazardTime,
      contactPhone: setContactPhone,
      selectedAerodrome: setSelectedAerodrome,
      latitude: setLatitude,
      longitude: setLongitude
    }
  );

  // Load aerodrome data
  useEffect(() => {
    fetch("/data/aerodrome-codes.json")
      .then((res) => res.json())
      .then((data) => {
        setAerodromes(data.aerodromes || []);
        setLoadingAerodromes(false);
      })
      .catch((err) => {
        console.error("Failed to load aerodrome data:", err);
        setLoadingAerodromes(false);
      });
  }, []);

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

  const handlePreview = (data: HazardFormData) => {
    // Validate required fields before showing preview
    if (!hazardDate || !hazardTime) {
      alert("Please provide both hazard date and time");
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
        Role: data.role === "Other" && data.customRole?.trim() ? data.customRole.trim() : data.role,
        Name1: data.Name1,
        Last_Name: data.Last_Name,
        Member_Number: data.Member_Number,
        Reporter_Email: data.Reporter_Email,
        Contact_Phone: contactPhone,
        Date_Hazard_Identified: datetime.toISOString().slice(0, 19),
        Location_of_Hazard: data.Location_of_Hazard,
        Location: data.Location_of_Hazard, // Map to generic location field
        Location_Latitude: latitude,
        Location_Longitude: longitude,
        State: data.State,
        Hazard_Relates_To_Specific_Aerodrome: data.hazardRelatesToSpecificAerodrome,
        Hazard_Aerodrome: selectedAerodrome || data.hazardAerodrome,
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
        setShowPreview(false);
        setSubmitSuccess(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
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

  // Show preview screen
  if (showPreview && previewData) {
    return (
      <HazardPreview
        data={previewData}
        hazardDate={hazardDate}
        hazardTime={hazardTime}
        contactPhone={contactPhone}
        selectedAerodrome={selectedAerodrome}
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
    <div className="min-h-screen bg-gray-50 py-12 px-6">
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
                  /<span className="text-slate-900 ml-2">Hazard Form</span>
                </div>
              </li>
            </ol>
          </nav>
        </div>


        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 text-center w-full mb-6">Lodge a New Hazard</h1>
        </div>

        <form onSubmit={handleSubmit(handlePreview)} className="space-y-6 border border-gray-300 rounded-lg shadow-lg bg-white ">
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
                  setSelectedAerodrome("");
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
                  {...register("role", { required: true })}
                  error={errors.role?.message}
                />
                {selectedRole === "Other" && (
                  <Input
                    label="Please specify your role"
                    type="text"
                    placeholder="Enter your role"
                    className="mt-2"
                    {...register("customRole")}
                    error={errors.customRole?.message}
                  />
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
              />
            </div>
          </div>

          {/* Hazard Information Section */}
          <div className="bg-white rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-8 border-b-2 border-gray-300 pb-4">Hazard Information</h2>

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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  label="Does the hazard relate to operations at a specific aerodrome?"
                  options={[
                    { value: "", label: "- Please Select -" },
                    { value: "Yes", label: "Yes" },
                    { value: "No", label: "No" },
                  ]}
                  {...register("hazardRelatesToSpecificAerodrome")}
                  error={errors.hazardRelatesToSpecificAerodrome?.message}
                />
              </div>

              {hazardRelatesToAerodrome === "Yes" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4">
                  <SearchableDropdown
                    options={aerodromes}
                    value={selectedAerodrome}
                    onChange={(value) => {
                      setSelectedAerodrome(value);
                      setValue("hazardAerodrome", value);
                    }}
                    label="Hazard Aerodrome"
                    placeholder={loadingAerodromes ? "Loading aerodromes..." : "Search for an aerodrome..."}
                    disabled={loadingAerodromes}
                    error={errors.hazardAerodrome?.message}
                  />
                </div>
              )}

              <Textarea
                label="Location of Hazard"
                required
                rows={3}
                {...register("Location_of_Hazard", { required: "Location of hazard is required" })}
                error={errors.Location_of_Hazard?.message}
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
                  Hazards that may pose an immediate safety risk to others should be reported to RAAus via phone as soon as practicable.
                  RAAus can be contacted on 02 6280 4700.
                </p>
              </div>
              
              {/* Divider */}
              <div className="w-full h-8"></div>

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
          <div className="flex justify-end space-x-4 mb-8 mr-8">
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