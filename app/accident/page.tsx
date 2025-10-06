"use client";

import { useState } from "react";
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
import { validationPatterns } from "@/lib/validations/patterns";
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
  const [memberWarning, setMemberWarning] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [pilotContactPhone, setPilotContactPhone] = useState("");
  const [occurrenceDate, setOccurrenceDate] = useState("");
  const [occurrenceTime, setOccurrenceTime] = useState("");
  const [didInvolveBirdAnimalStrike, setDidInvolveBirdAnimalStrike] = useState(false);
  const [didInvolveNearMiss, setDidInvolveNearMiss] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<AccidentFormData>();

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

  const nextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
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

      // Convert date and time to ISO 8601 format
      const datetime = new Date(`${occurrenceDate}T${occurrenceTime}`);

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

      const fullOccurrenceDate = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}+10:00`;

      // Upload attachments if any
      let attachmentLinks: string[] = [];
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (fileInput?.files && fileInput.files.length > 0) {
        const formData = new FormData();
        Array.from(fileInput.files).forEach((file) => {
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
        Pilot_Contact_Phone: pilotContactPhone,
        Occurrence_Date: fullOccurrenceDate,
        Accident_Incident: true, // Mark this as an accident/incident report
        attachmentLinks: attachmentLinks.join(", "),
      };

      console.log("Submitting Accident/Incident to CRM:", {
        module: "Occurrence_Management",
        data: crmData,
        dateDebug: {
          occurrenceDate,
          occurrenceTime,
          iso: fullOccurrenceDate
        }
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
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Accident/Incident Report Submitted</h2>
          <p className="text-gray-600 mb-6">
            Your accident/incident report has been successfully submitted to RAAus. You will receive a confirmation email shortly.
          </p>
          <Button onClick={() => (window.location.href = "/")}>Return to Home</Button>
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

                    <Input
                      label="Member Number"
                      type="number"
                      placeholder="123456"
                      error={errors.memberNumber?.message}
                      {...register("memberNumber", {
                        minLength: {
                          value: 5,
                          message: "Minimum 5 characters required"
                        },
                        maxLength: {
                          value: 6,
                          message: "Maximum 6 characters allowed"
                        },
                        onChange: (e) => {
                          const memberNumber = e.target.value;
                          const firstName = watch("firstName");
                          const lastName = watch("lastName");
                          if (memberNumber && firstName && lastName) {
                            validateMember(memberNumber, firstName, lastName);
                          }
                        }
                      })}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    <Input
                      label="First Name"
                      required
                      placeholder="John"
                      error={errors.firstName?.message}
                      {...register("firstName", {
                        required: "This field cannot be blank.",
                        pattern: {
                          value: /^[a-zA-Z -]{3,16}$/,
                          message: "Entered value is invalid"
                        },
                        minLength: {
                          value: 2,
                          message: "Invalid minimum characters"
                        },
                        maxLength: {
                          value: 30,
                          message: "Maximum 30 characters allowed"
                        },
                        onChange: (e) => {
                          const firstName = e.target.value;
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
                      error={errors.lastName?.message}
                      {...register("lastName", {
                        required: "This field cannot be blank.",
                        pattern: {
                          value: /^[a-z A-Z -]{3,16}$/,
                          message: "Entered value is invalid"
                        },
                        minLength: {
                          value: 2,
                          message: "Invalid minimum characters"
                        },
                        maxLength: {
                          value: 30,
                          message: "Maximum 30 characters allowed"
                        },
                        onChange: (e) => {
                          const lastName = e.target.value;
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
                      error={errors.emailAddress?.message}
                      {...register("emailAddress", {
                        pattern: {
                          value: validationPatterns.email,
                          message: "Email is invalid"
                        }
                      })}
                    />

                    <PhoneInput
                      label="Contact Phone"
                      required
                      placeholder="0412 345 678"
                      value={contactPhone}
                      onValueChange={setContactPhone}
                      error={errors.contactPhone?.message}
                    />
                  </div>

                  {memberWarning && (
                    <div className="mt-4 p-3 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded">
                      {memberWarning}
                    </div>
                  )}
                </div>

                {/* Pilot in Command Section */}
                <div className="border-b border-gray-200 pb-8">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Pilot in Command</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input
                      label="Member Number"
                      type="number"
                      placeholder="123456"
                      helpText="Must be 4 digits. If number is less, add 0's to front of number. E.g. 349 becomes 0349. If the pilot was not a member, leave blank."
                      error={errors.pilotMemberNumber?.message}
                      {...register("pilotMemberNumber", {
                        minLength: {
                          value: 5,
                          message: "minimum 5 characters length"
                        },
                        maxLength: {
                          value: 6,
                          message: "Maximum 6 characters allowed"
                        }
                      })}
                    />

                    <Input
                      label="Date of Birth"
                      type="date"
                      {...register("pilotDateOfBirth")}
                      error={errors.pilotDateOfBirth?.message}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    <Input
                      label="First Name"
                      placeholder="John"
                      error={errors.pilotFirstName?.message}
                      {...register("pilotFirstName", {
                        pattern: {
                          value: /^[a-zA-Z -]{3,16}$/,
                          message: "Entered value is invalid"
                        }
                      })}
                    />

                    <Input
                      label="Last Name"
                      placeholder="Smith"
                      error={errors.pilotLastName?.message}
                      {...register("pilotLastName", {
                        pattern: {
                          value: /^[a-zA-Z -]{3,16}$/,
                          message: "Entered value is invalid"
                        }
                      })}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    <PhoneInput
                      label="Contact Phone"
                      placeholder="0412 345 678"
                      value={pilotContactPhone}
                      onValueChange={setPilotContactPhone}
                      error={errors.pilotContactPhone?.message}
                    />

                    <Input
                      label="Email"
                      type="email"
                      placeholder="example@domain.com"
                      error={errors.pilotEmail?.message}
                      {...register("pilotEmail", {
                        pattern: {
                          value: validationPatterns.email,
                          message: "Email is invalid"
                        }
                      })}
                    />
                  </div>
                </div>

                {/* Flying Hours Section */}
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Flying Hours</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input
                      label="Hours Last 90 Days"
                      type="number"
                      placeholder="45.2"
                      step="0.1"
                      error={errors.hoursLast90Days?.message}
                      {...register("hoursLast90Days")}
                    />

                    <Input
                      label="Total Flying Hours"
                      placeholder="5280.7"
                      error={errors.totalFlyingHours?.message}
                      {...register("totalFlyingHours")}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    <Input
                      label="Hours on Type"
                      placeholder="850.3"
                      error={errors.hoursOnType?.message}
                      {...register("hoursOnType")}
                    />

                    <Input
                      label="Hours on Type Last 90 Days"
                      required
                      placeholder="25.5"
                      error={errors.hoursOnTypeLast90Days?.message}
                      {...register("hoursOnTypeLast90Days", {
                        required: "This field cannot be blank."
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
                      <div className="flex gap-2">
                        <input
                          type="date"
                          value={occurrenceDate}
                          onChange={(e) => setOccurrenceDate(e.target.value)}
                          className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                        <input
                          type="time"
                          value={occurrenceTime}
                          onChange={(e) => setOccurrenceTime(e.target.value)}
                          className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
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
                      maxLength={255}
                      error={errors.location?.message}
                      {...register("location", {
                        required: "This field cannot be blank.",
                        minLength: {
                          value: 4,
                          message: "Invalid minimum characters length"
                        },
                        maxLength: {
                          value: 255,
                          message: "Invalid maximum characters length"
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
                          message: "Invalid minimum characters length"
                        },
                        maxLength: {
                          value: 255,
                          message: "Invalid maximum characters length"
                        }
                      })}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    <Select
                      label="Damage to Aircraft"
                      required
                      options={damageOptions}
                      error={errors.damageToAircraft?.message}
                      {...register("damageToAircraft", { 
                        required: "This field cannot be blank." 
                      })}
                    />

                    <Select
                      label="Most Serious Injury to Pilot"
                      required
                      options={injuryOptions}
                      error={errors.mostSeriousInjuryToPilot?.message}
                      {...register("mostSeriousInjuryToPilot", { 
                        required: "This field cannot be blank." 
                      })}
                    />
                  </div>

                  <div className="mt-6">
                    <Select
                      label="Did this occurrence involve an aircraft conducting IFR or air transport operations (airline/charter/cargo/medical)"
                      options={yesNoOptions}
                      error={errors.didInvolveIFR?.message}
                      {...register("didInvolveIFR")}
                    />
                  </div>

                  <div className="mt-6">
                    <Select
                      label="Did the occurrence take place in controlled airspace or special use airspace(military/danger/restricted/prohibited)?"
                      options={yesNoOptions}
                      error={errors.didOccurInControlledAirspace?.message}
                      {...register("didOccurInControlledAirspace")}
                    />
                  </div>

                  <div className="mt-6">
                    <Input
                      label="Passenger Details"
                      placeholder="Please supply names of other passenger if applicable"
                      error={errors.passengerDetails?.message}
                      {...register("passengerDetails", {
                        pattern: {
                          value: /^[a-zA-Z\s]*$/,
                          message: "Entered value is invalid"
                        }
                      })}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    <Select
                      label="Passenger Injury"
                      options={injuryOptions}
                      error={errors.passengerInjury?.message}
                      {...register("passengerInjury")}
                    />

                    <Select
                      label="Persons on the Ground Injury"
                      options={injuryOptions}
                      error={errors.personsOnGroundInjury?.message}
                      {...register("personsOnGroundInjury")}
                    />
                  </div>

                  <div className="mt-6">
                    <Textarea
                      label="Description of Damage to Aircraft"
                      required
                      rows={3}
                      maxLength={255}
                      error={errors.descriptionOfDamage?.message}
                      {...register("descriptionOfDamage", {
                        required: "This field cannot be blank.",
                        minLength: {
                          value: 4,
                          message: "Invalid minimum characters length"
                        },
                        maxLength: {
                          value: 255,
                          message: "Invalid maximum characters length"
                        }
                      })}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    <Input
                      label="Maintainer First Name"
                      placeholder="Robert Johnson"
                      error={errors.maintainerFirstName?.message}
                      {...register("maintainerFirstName", {
                        pattern: {
                          value: /^[a-z A-Z -]{3,16}$/,
                          message: "Entered value is invalid"
                        }
                      })}
                    />

                    <Input
                      label="Maintainer Member Number"
                      placeholder="e.g. 6789"
                      error={errors.maintainerMemberNumber?.message}
                      {...register("maintainerMemberNumber", {
                        pattern: {
                          value: /^[0-9]*$/,
                          message: "Entered value is invalid"
                        }
                      })}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    <Input
                      label="Maintainer Last Name"
                      placeholder="Johnson"
                      error={errors.maintainerLastName?.message}
                      {...register("maintainerLastName", {
                        pattern: {
                          value: /^[a-z A-Z -]{3,16}$/,
                          message: "Entered value is invalid"
                        }
                      })}
                    />

                    <Select
                      label="Maintainer Level"
                      options={maintainerLevelOptions}
                      error={errors.maintainerLevel?.message}
                      {...register("maintainerLevel")}
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
                            {...register("isAccidentOrIncident", { required: "This field cannot be blank." })}
                            className="mr-2"
                          />
                          Accident
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            value="Incident"
                            {...register("isAccidentOrIncident", { required: "This field cannot be blank." })}
                            className="mr-2"
                          />
                          Incident
                        </label>
                      </div>
                      {errors.isAccidentOrIncident && (
                        <p className="text-red-500 text-sm mt-1">{errors.isAccidentOrIncident.message}</p>
                      )}
                    </fieldset>
                  </div>

                  <div className="mt-6">
                    <Textarea
                      label="What may have contributed to the event?"
                      required
                      rows={3}
                      error={errors.whatContributed?.message}
                      {...register("whatContributed", {
                        required: "This field cannot be blank."
                      })}
                    />
                  </div>

                  <div className="mt-6">
                    <Textarea
                      label="Do you have further suggestions on how to prevent similar occurrences?"
                      required
                      rows={3}
                      error={errors.preventionSuggestions?.message}
                      {...register("preventionSuggestions", {
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
                            {...register("reportingMatter", { required: "This field cannot be blank." })}
                            className="mr-2"
                          />
                          Immediately reportable matter
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            value="RRM"
                            {...register("reportingMatter", { required: "This field cannot be blank." })}
                            className="mr-2"
                          />
                          Routinely reportable matter
                        </label>
                      </div>
                      {errors.reportingMatter && (
                        <p className="text-red-500 text-sm mt-1">{errors.reportingMatter.message}</p>
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
                      error={errors.departureLocation?.message}
                      {...register("departureLocation", {
                        pattern: {
                          value: /^[a-zA-Z0-9\s]*$/,
                          message: "Entered value is invalid"
                        }
                      })}
                    />

                    <Input
                      label="Destination Location"
                      placeholder="Enter destination location"
                      error={errors.destinationLocation?.message}
                      {...register("destinationLocation", {
                        pattern: {
                          value: /^[a-zA-Z0-9\s]*$/,
                          message: "Entered value is invalid"
                        }
                      })}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    <Input
                      label="Landing"
                      placeholder="Enter landing location"
                      helpText="(if different to destination)"
                      error={errors.landing?.message}
                      {...register("landing", {
                        pattern: {
                          value: /^[a-zA-Z0-9\s]*$/,
                          message: "Entered value is invalid"
                        }
                      })}
                    />

                    <Select
                      label="Type of Operation"
                      required
                      options={typeOfOperationOptions}
                      error={errors.typeOfOperation?.message}
                      {...register("typeOfOperation", { 
                        required: "This field cannot be blank." 
                      })}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    <Select
                      label="Name of Flight Training School"
                      required
                      options={flightTrainingSchoolOptions}
                      error={errors.nameOfFlightTrainingSchool?.message}
                      {...register("nameOfFlightTrainingSchool", { 
                        required: "This field cannot be blank." 
                      })}
                    />

                    <Select
                      label="Phase of Flight"
                      options={phaseOfFlightOptions}
                      error={errors.phaseOfFlight?.message}
                      {...register("phaseOfFlight")}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    <Select
                      label="Effect of Flight"
                      options={effectOfFlightOptions}
                      error={errors.effectOfFlight?.message}
                      {...register("effectOfFlight")}
                    />

                    <Select
                      label="Flight Rules"
                      options={flightRulesOptions}
                      error={errors.flightRules?.message}
                      {...register("flightRules")}
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
                      error={errors.airspaceClass?.message}
                      {...register("airspaceClass")}
                    />

                    <Select
                      label="Airspace Type"
                      options={airspaceTypeOptions}
                      error={errors.airspaceType?.message}
                      {...register("airspaceType")}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    <Input
                      label="Altitude"
                      type="number"
                      placeholder="200"
                      error={errors.altitude?.message}
                      {...register("altitude")}
                    />

                    <Select
                      label="Altitude Type"
                      options={altitudeTypeOptions}
                      error={errors.altitudeType?.message}
                      {...register("altitudeType")}
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
                      error={errors.lightConditions?.message}
                      {...register("lightConditions")}
                    />

                    <Input
                      label="Visibility"
                      type="number"
                      step="0.1"
                      placeholder="30.0"
                      suffix="NM"
                      error={errors.visibility?.message}
                      {...register("visibility")}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    <Input
                      label="Wind Speed"
                      type="number"
                      step="0.1"
                      placeholder="10.0"
                      suffix="knots"
                      error={errors.windSpeed?.message}
                      {...register("windSpeed")}
                    />

                    <Select
                      label="Wind Direction"
                      options={windDirectionOptions}
                      error={errors.windDirection?.message}
                      {...register("windDirection")}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    <Select
                      label="Visibility Reduced By"
                      options={visibilityReducedByOptions}
                      error={errors.visibilityReducedBy?.message}
                      {...register("visibilityReducedBy")}
                    />

                    <Input
                      label="Temperature"
                      type="number"
                      step="0.1"
                      placeholder="20.0"
                      suffix="°C"
                      error={errors.temperature?.message}
                      {...register("temperature")}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    <Select
                      label="Wind Gusting"
                      required
                      options={windGustingOptions}
                      error={errors.windGusting?.message}
                      {...register("windGusting", { 
                        required: "This field cannot be blank." 
                      })}
                    />

                    <Select
                      label="Personal Locator Beacon carried"
                      required
                      options={yesNoOptions}
                      error={errors.personalLocatorBeacon?.message}
                      {...register("personalLocatorBeacon", { 
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
                          setValue("didInvolveNearMiss", checked ? "Yes" : "No");
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
                          setValue("didInvolveBirdAnimalStrike", checked ? "Yes" : "No");
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
                        error={errors.typeOfStrike?.message}
                        {...register("typeOfStrike")}
                      />

                      <Select
                        label="Size"
                        options={sizeOptions}
                        error={errors.size?.message}
                        {...register("size")}
                      />
                    </div>

                    <div className="mt-6">
                      <Input
                        label="Species"
                        placeholder="Enter species name"
                        error={errors.species?.message}
                        {...register("species")}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                      <Select
                        label="Number (approx)"
                        options={numberOptions}
                        error={errors.numberApprox?.message}
                        {...register("numberApprox")}
                      />

                      <Select
                        label="Number Struck (approx)"
                        options={numberOptions}
                        error={errors.numberStruckApprox?.message}
                        {...register("numberStruckApprox")}
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
                        error={errors.secondAircraftRegistration?.message}
                        {...register("secondAircraftRegistration", {
                          pattern: {
                            value: /[a-z0-9_-]{3,16}/,
                            message: "Entered value is invalid"
                          }
                        })}
                      />

                      <Input
                        label="Second Aircraft Manufacturer"
                        placeholder="abc-123"
                        error={errors.secondAircraftManufacturer?.message}
                        {...register("secondAircraftManufacturer", {
                          pattern: {
                            value: /^[a-z0-9_ /-]{3,16}$/,
                            message: "Entered value is invalid"
                          }
                        })}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                      <Input
                        label="Second Aircraft Model"
                        placeholder="abc-123"
                        error={errors.secondAircraftModel?.message}
                        {...register("secondAircraftModel", {
                          pattern: {
                            value: /^[a-z0-9_ /-]{3,16}$/,
                            message: "Entered value is invalid"
                          }
                        })}
                      />

                      <Input
                        label="Horizontal Proximity"
                        type="number"
                        placeholder="e.g., 150"
                        error={errors.horizontalProximity?.message}
                        {...register("horizontalProximity")}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                      <Select
                        label="Horizontal Proximity Unit"
                        options={proximityUnitOptions}
                        error={errors.horizontalProximityUnit?.message}
                        {...register("horizontalProximityUnit")}
                      />

                      <Input
                        label="Vertical Proximity"
                        type="number"
                        step="0.1"
                        placeholder="e.g., 0.5"
                        error={errors.verticalProximity?.message}
                        {...register("verticalProximity")}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                      <Select
                        label="Vertical Proximity Unit"
                        options={verticalProximityUnitOptions}
                        error={errors.verticalProximityUnit?.message}
                        {...register("verticalProximityUnit")}
                      />

                      <Select
                        label="Relative Track"
                        options={relativeTrackOptions}
                        error={errors.relativeTrack?.message}
                        {...register("relativeTrack")}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                      <Select
                        label="Avoidance Manoeuvre Needed?"
                        options={avoidanceManoeuvreOptions}
                        error={errors.avoidanceManoeuvreNeeded?.message}
                        {...register("avoidanceManoeuvreNeeded")}
                      />

                      <Select
                        label="Alert Received"
                        required
                        options={alertReceivedOptions}
                        error={errors.alertReceived?.message}
                        {...register("alertReceived", { 
                          required: "This field cannot be blank." 
                        })}
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
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Select
                      label="Registration Number Prefix"
                      required
                      options={registrationPrefixOptions}
                      {...register('registrationPrefix', { required: 'Registration prefix is required' })}
                      error={errors.registrationPrefix?.message}
                    />
                    
                    <Input
                      label="Registration Number Suffix"
                      placeholder="1234"
                      required
                      maxLength={4}
                      minLength={4}
                      {...register('registrationSuffix', { 
                        required: 'Registration suffix is required',
                        minLength: { value: 4, message: 'Minimum 4 characters required' }
                      })}
                      error={errors.registrationSuffix?.message}
                    />
                    
                    <Input
                      label="Serial Number"
                      required
                      {...register('serialNumber', { required: 'Serial number is required' })}
                      error={errors.serialNumber?.message}
                    />
                    
                    <Input
                      label="Make"
                      required
                      {...register('aircraftMake', { required: 'Aircraft make is required' })}
                      error={errors.aircraftMake?.message}
                    />
                    
                    <Input
                      label="Model"
                      required
                      {...register('aircraftModel', { required: 'Aircraft model is required' })}
                      error={errors.aircraftModel?.message}
                    />
                    
                    <Select
                      label="Registration Status"
                      required
                      options={registrationStatusOptions}
                      {...register('registrationStatus', { required: 'Registration status is required' })}
                      error={errors.registrationStatus?.message}
                    />
                    
                    <Select
                      label="Type"
                      required
                      options={aircraftTypeOptions}
                      {...register('aircraftType', { required: 'Aircraft type is required' })}
                      error={errors.aircraftType?.message}
                    />
                    
                    <Select
                      label="Year Built"
                      required
                      options={yearBuiltOptions}
                      {...register('yearBuilt', { required: 'Year built is required' })}
                      error={errors.yearBuilt?.message}
                    />
                    
                    <Input
                      label="Total Airframe Hours"
                      type="number"
                      placeholder="200"
                      {...register('totalAirframeHours')}
                      error={errors.totalAirframeHours?.message}
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
                      {...register('engineMake', { required: 'Engine make is required' })}
                      error={errors.engineMake?.message}
                    />
                    
                    <Input
                      label="Engine Model"
                      {...register('engineModel')}
                      error={errors.engineModel?.message}
                    />
                    
                    <Input
                      label="Engine Serial"
                      {...register('engineSerial')}
                      error={errors.engineSerial?.message}
                    />
                    
                    <Input
                      label="Total Engine Hours"
                      type="number"
                      placeholder="200"
                      {...register('totalEngineHours')}
                      error={errors.totalEngineHours?.message}
                    />
                    
                    <div className="md:col-start-2">
                      <Input
                        label="Total Hours Since Service"
                        type="number"
                        placeholder="103"
                        {...register('hoursSinceService')}
                        error={errors.hoursSinceService?.message}
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
                      {...register('propellerMake')}
                      error={errors.propellerMake?.message}
                    />
                    
                    <Input
                      label="Propeller Model"
                      {...register('propellerModel')}
                      error={errors.propellerModel?.message}
                    />
                    
                    <Input
                      label="Propeller Serial"
                      {...register('propellerSerial')}
                      error={errors.propellerSerial?.message}
                    />
                    
                    <Select
                      label="Personal Locator Beacon carried"
                      required
                      options={plbOptions}
                      {...register('plbCarried', { required: 'PLB status is required' })}
                      error={errors.plbCarried?.message}
                    />
                    
                    <div className="md:col-span-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          {...register('plbActivated')}
                          id="plbActivated"
                        />
                        <label htmlFor="plbActivated" className="text-sm font-medium text-gray-700">
                          PLB Activated
                        </label>
                      </div>
                    </div>
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
                        onChange={(files) => {
                          // Handle file upload here if needed
                          console.log('Files selected:', files);
                        }}
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
