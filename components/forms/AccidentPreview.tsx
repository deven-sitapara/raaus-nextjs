"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { AccidentFormData } from "@/types/forms";
import aerodromeData from "@/components/forms/aerodrome-codes.json";
import accountsData from "@/components/forms/accounts-codes.json";

interface AccidentPreviewProps {
  data: AccidentFormData;
  occurrenceDate: string;
  occurrenceTime: string;
  contactPhone: string;
  pilotContactPhone: string;
  latitude?: string;
  longitude?: string;
  attachments: FileList | null;
  onBack: () => void;
  onConfirm: () => void;
  isSubmitting: boolean;
}

export default function AccidentPreview({
  data,
  occurrenceDate,
  occurrenceTime,
  contactPhone,
  pilotContactPhone,
  latitude,
  longitude,
  attachments,
  onBack,
  onConfirm,
  isSubmitting,
}: AccidentPreviewProps) {
  const [currentTab, setCurrentTab] = useState(1);
  
  // Helper function to get aerodrome name from ID
  const getAerodromeName = (id: string | undefined) => {
    if (!id) return undefined;
    const aerodrome = aerodromeData.aerodromes.find(a => a.id === id);
    return aerodrome?.Name;
  };
  
  // Helper function to get account name from ID
  const getAccountName = (id: string | undefined) => {
    if (!id) return undefined;
    const account = accountsData.accounts.find(a => a.id === id);
    return account?.Account_Name;
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const formatDateTime = (date: string, time: string) => {
    if (!date || !time) return "N/A";
    const dateObj = new Date(`${date}T${time}`);
    return dateObj.toLocaleString("en-AU", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = (date: string) => {
    if (!date) return "N/A";
    const dateObj = new Date(date);
    return dateObj.toLocaleDateString("en-AU", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const PreviewSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="mb-8">
      <h2 className="text-lg font-semibold text-gray-800 mb-5 pb-3 border-b-2 border-gray-300">
        {title}
      </h2>
      {children}
    </div>
  );

  const PreviewField = ({ 
    label, 
    value, 
    fullWidth = false 
  }: { 
    label: string; 
    value: string | undefined | boolean | null;
    fullWidth?: boolean;
  }) => {
    const isEmpty = value === undefined || value === null || value === "";
    const displayValue = isEmpty 
      ? "Not answered" 
      : typeof value === 'boolean' 
        ? (value ? 'Yes' : 'No') 
        : String(value);
    
    const isLongText = !isEmpty && (displayValue.length > 100 || displayValue.includes('\n'));
    
    return (
      <div className={`${fullWidth ? 'col-span-2' : ''} mb-5`}>
        <dt className="text-sm font-semibold text-gray-700 mb-2">
          {label}
        </dt>
        <dd className={`text-base px-4 py-3 ${
          isEmpty 
            ? 'text-gray-400 bg-gray-100 border-l-4 border-gray-300 italic' 
            : 'text-gray-900 bg-gray-50 border-l-4 border-gray-400'
        } ${isLongText ? 'whitespace-pre-wrap max-h-60 overflow-y-auto' : ''}`}>
          {displayValue}
        </dd>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Breadcrumb */}
        <div className="mb-6">
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
                  /<span className="text-slate-900 ml-2">Accident Form Preview</span>
                </div>
              </li>
            </ol>
          </nav>
        </div>

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Review Your Submission</h1>
          <p className="text-gray-600">
            Please review all information carefully before submitting. Use the tabs to navigate between sections.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="flex space-x-1 border-b border-gray-300">
            <button
              type="button"
              onClick={() => setCurrentTab(1)}
              className={`px-6 py-3 font-semibold text-sm transition-colors ${
                currentTab === 1
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              Step 1: Pilot Information
            </button>
            <button
              type="button"
              onClick={() => setCurrentTab(2)}
              className={`px-6 py-3 font-semibold text-sm transition-colors ${
                currentTab === 2
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              Step 2: Occurrence Information
            </button>
            <button
              type="button"
              onClick={() => setCurrentTab(3)}
              className={`px-6 py-3 font-semibold text-sm transition-colors ${
                currentTab === 3
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              Step 3: Aircraft Information
            </button>
          </div>
        </div>

        {/* Preview Content */}
        <div className="bg-white border border-gray-300 rounded-md shadow-sm p-8 mb-6 min-h-[600px]">
          
          {/* TAB 1: Reporter & Pilot Information */}
          {currentTab === 1 && (
            <>
              {/* Person Reporting */}
              <PreviewSection title="Person Reporting">
                <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
                  <PreviewField label="Role" value={data.role} />
                  {data.role === "Other" && (
                    <PreviewField label="Custom Role" value={data.customRole} />
                  )}
                  <PreviewField label="Member Number" value={data.Member_Number} />
                  <PreviewField label="First Name" value={data.Name1} />
                  <PreviewField label="Last Name" value={data.Last_Name} />
                  <PreviewField label="Email" value={data.Reporter_Email} />
                  <PreviewField label="Contact Phone" value={contactPhone} />
                </dl>
              </PreviewSection>

              {/* Pilot in Command */}
              <PreviewSection title="Pilot in Command">
                <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
                  <PreviewField label="Member Number" value={data.PIC_Member_Number} />
                  <PreviewField label="Date of Birth" value={data.Date_of_Birth ? formatDate(data.Date_of_Birth) : undefined} />
                  <PreviewField label="First Name" value={data.PIC_Name} />
                  <PreviewField label="Last Name" value={data.PIC_Last_Name} />
                  <PreviewField label="Email" value={data.PIC_Email} />
                  <PreviewField label="Contact Phone" value={pilotContactPhone} />
                  <PreviewField label="Hours Last 90 Days" value={data.Hours_last_90_days} />
                  <PreviewField label="Total Flying Hours" value={data.Total_flying_hours} />
                  <PreviewField label="Hours on Type" value={data.Hours_on_type} />
                  <PreviewField label="Hours on Type (Last 90 Days)" value={data.Hours_on_type_last_90_days} />
                </dl>
              </PreviewSection>

              {/* Attachments */}
              {attachments && attachments.length > 0 && (
                <PreviewSection title="Attachments">
                  <div className="space-y-2">
                    {Array.from(attachments).map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between px-4 py-3 bg-gray-50 border-l-4 border-gray-400"
                      >
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                          <svg
                            className="w-5 h-5 text-gray-600 flex-shrink-0"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                            />
                          </svg>
                          <span className="text-sm text-gray-900 truncate font-medium">
                            {file.name}
                          </span>
                        </div>
                        <span className="text-sm text-gray-600 ml-4">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </span>
                      </div>
                    ))}
                  </div>
                </PreviewSection>
              )}
            </>
          )}

          {/* TAB 2: Occurrence Information */}
          {currentTab === 2 && (
            <>
              {/* Occurrence Details */}
              <PreviewSection title="Occurrence Details">
                <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
                  <PreviewField
                    label="Occurrence Date & Time"
                    value={formatDateTime(occurrenceDate, occurrenceTime)}
                    fullWidth
                  />
                  <PreviewField label="State" value={data.State} />
                  <PreviewField label="Location" value={data.Location} />
                  {latitude && longitude && (
                    <PreviewField 
                      label="GPS Coordinates" 
                      value={`Latitude: ${latitude}, Longitude: ${longitude}`}
                      fullWidth
                    />
                  )}
                  <PreviewField 
                    label="Details of Incident/Accident" 
                    value={data.Details_of_incident_accident}
                    fullWidth
                  />
                </dl>
              </PreviewSection>

              {/* Damage & Injury */}
              <PreviewSection title="Damage & Injury">
                <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
                  <PreviewField label="Damage to Aircraft" value={data.Damage_to_aircraft} />
                  <PreviewField label="Most Serious Injury to Pilot" value={data.Most_serious_injury_to_pilot} />
                  <PreviewField label="Involve IFR/Air Transport Operations" value={data.Involve_IFR_or_Air_Transport_Operations} />
                  <PreviewField label="In Controlled/Special Use Airspace" value={data.In_controlled_or_special_use_airspace} />
                  <PreviewField label="In Vicinity of Aerodrome" value={data.In_vicinity_of_aerodrome} />
                  <PreviewField label="Vicinity Aerodrome (Y Code)" value={getAerodromeName(data.Y_Code)} />
                  <PreviewField 
                    label="Passenger Details" 
                    value={data.Passenger_details}
                    fullWidth
                  />
                  <PreviewField label="Passenger Injury" value={data.Passenger_injury} />
                  <PreviewField label="Persons on Ground Injury" value={data.Persons_on_the_ground_injury} />
                  <PreviewField 
                    label="Description of Damage to Aircraft" 
                    value={data.Description_of_damage_to_aircraft}
                    fullWidth
                  />
                </dl>
              </PreviewSection>

              {/* Maintainer Information */}
              <PreviewSection title="Maintainer Information">
                <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
                  <PreviewField label="Maintainer First Name" value={data.Maintainer_Name} />
                  <PreviewField label="Maintainer Member Number" value={data.Maintainer_Member_Number} />
                  <PreviewField label="Maintainer Last Name" value={data.Maintainer_Last_Name} />
                  <PreviewField label="Maintainer Level" value={data.Maintainer_Level} />
                </dl>
              </PreviewSection>

              {/* Occurrence Classification */}
              <PreviewSection title="Occurrence Classification">
                <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
                  <PreviewField label="Accident or Incident" value={data.Accident_or_Incident} />
                  <PreviewField label="ATSB Reportable Status" value={data.ATSB_reportable_status} />
                  <PreviewField 
                    label="What may have contributed to the event?" 
                    value={data.Details_of_incident_accident}
                    fullWidth
                  />
                  <PreviewField 
                    label="Suggestions to prevent similar occurrences" 
                    value={data.Reporter_Suggestions}
                    fullWidth
                  />
                </dl>
              </PreviewSection>

              {/* Flight Details */}
              <PreviewSection title="Flight Details">
                <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
                  <PreviewField label="Departure Location" value={data.Departure_location} />
                  <PreviewField label="Destination Location" value={data.Destination_location} />
                  <PreviewField label="Landing (if different)" value={data.Landing} />
                  <PreviewField label="Type of Operation" value={data.Type_of_operation} />
                  <PreviewField label="Flight Training School" value={getAccountName(data.Lookup_5)} />
                  <PreviewField label="Phase of Flight" value={data.Phase_of_flight} />
                  <PreviewField label="Effect of Flight" value={data.Effect_of_flight} />
                  <PreviewField label="Flight Rules" value={data.Flight_Rules} />
                </dl>
              </PreviewSection>

              {/* Airspace */}
              <PreviewSection title="Airspace">
                <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
                  <PreviewField label="Airspace Class" value={data.Airspace_class} />
                  <PreviewField label="Airspace Type" value={data.Airspace_type} />
                  <PreviewField label="Altitude" value={data.Altitude} />
                  <PreviewField label="Altitude Type" value={data.Altitude_type} />
                </dl>
              </PreviewSection>

              {/* Environment */}
              <PreviewSection title="Environment">
                <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
                  <PreviewField label="Light Conditions" value={data.Light_conditions} />
                  <PreviewField label="Visibility" value={data.Visibility ? `${data.Visibility} NM` : data.Visibility} />
                  <PreviewField label="Wind Speed" value={data.Wind_speed ? `${data.Wind_speed} knots` : data.Wind_speed} />
                  <PreviewField label="Wind Direction" value={data.Wind_direction} />
                  <PreviewField label="Visibility Reduced By" value={data.Visibility_reduced_by} />
                  <PreviewField label="Temperature" value={data.Temperature ? `${data.Temperature}°C` : data.Temperature} />
                  <PreviewField label="Wind Gusting" value={data.Wind_gusting} />
                  <PreviewField label="Personal Locator Beacon Carried" value={data.Personal_Locator_Beacon_carried} />
                </dl>
              </PreviewSection>

              {/* Bird/Animal Strike - Always show if checked */}
              {(data.Bird_or_Animal_Strike === true || data.Bird_or_Animal_Strike === "Yes") && (
                <PreviewSection title="Bird/Animal Strike">
                  <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
                    <PreviewField label="Bird/Animal Strike" value={data.Bird_or_Animal_Strike} />
                    <PreviewField label="Type of Strike" value={data.Type_of_strike} />
                    <PreviewField label="Size" value={data.Size} />
                    <PreviewField label="Species" value={data.Species} />
                    <PreviewField label="Number (approx)" value={data.Number_approx} />
                    <PreviewField label="Number Struck (approx)" value={data.Number_struck_approx} />
                  </dl>
                </PreviewSection>
              )}

              {/* Near Miss with Another Aircraft - Always show if checked */}
              {(data.Involve_near_miss_with_another_aircraft === true || data.Involve_near_miss_with_another_aircraft === "Yes") && (
                <PreviewSection title="Near Collision with Another Aircraft">
                  <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
                    <PreviewField label="Near Miss with Another Aircraft" value={data.Involve_near_miss_with_another_aircraft} />
                    <PreviewField label="Second Aircraft Registration" value={data.Second_aircraft_registration} />
                    <PreviewField label="Second Aircraft Manufacturer" value={data.Second_Aircraft_Manufacturer} />
                    <PreviewField label="Second Aircraft Model" value={data.Second_Aircraft_Model} />
                    <PreviewField label="Horizontal Proximity" value={data.Horizontal_Proximity} />
                    <PreviewField label="Horizontal Proximity Unit" value={data.Horizontal_Proximity_Unit} />
                    <PreviewField label="Vertical Proximity" value={data.Vertical_Proximity} />
                    <PreviewField label="Vertical Proximity Unit" value={data.Vertical_Proximity_Unit} />
                    <PreviewField label="Relative Track" value={data.Relative_Track} />
                    <PreviewField label="Avoidance Manoeuvre Needed" value={data.Avoidance_manoeuvre_needed} />
                    <PreviewField label="Alert Received" value={data.Alert_Received} />
                  </dl>
                </PreviewSection>
              )}
            </>
          )}

          {/* TAB 3: Aircraft Information */}
          {currentTab === 3 && (
            <>
              {/* Aircraft Information */}
              <PreviewSection title="Aircraft Information">
                <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
                  <PreviewField label="Registration Number Prefix" value={data.Registration_number} />
                  <PreviewField label="Registration Number Suffix" value={data.Serial_number1} />
                  <PreviewField label="Serial Number" value={data.Serial_number} />
                  <PreviewField label="Make" value={data.Make1} />
                  <PreviewField label="Model" value={data.Model} />
                  <PreviewField label="Registration Status" value={data.Registration_status} />
                  <PreviewField label="Type" value={data.Type1} />
                  <PreviewField label="Year Built" value={data.Year_Built1} />
                  <PreviewField label="Total Airframe Hours" value={data.Total_airframe_hours} />
                </dl>
              </PreviewSection>

              {/* Engine Details */}
              <PreviewSection title="Engine Details">
                <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
                  <PreviewField label="Engine Make" value={data.Engine_Details} />
                  <PreviewField label="Engine Model" value={data.Engine_model} />
                  <PreviewField label="Engine Serial" value={data.Engine_serial} />
                  <PreviewField label="Total Engine Hours" value={data.Total_engine_hours} />
                  <PreviewField label="Total Hours Since Service" value={data.Total_hours_since_service} />
                </dl>
              </PreviewSection>

              {/* Propeller Details */}
              <PreviewSection title="Propeller Details">
                <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
                  <PreviewField label="Propeller Make" value={data.Propeller_make} />
                  <PreviewField label="Propeller Model" value={data.Propeller_model} />
                  <PreviewField label="Propeller Serial" value={data.Propeller_serial} />
                  <PreviewField label="PLB Activated" value={data.PLB_Activated} />
                </dl>
              </PreviewSection>
            </>
          )}

          {/* Important Notice */}
          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded">
            <p className="text-sm text-gray-800">
              <strong>Important:</strong> Immediately reportable matters are required to be notified 
              to RAAus via phone as soon as practicable. RAAus can be contacted on{" "}
              <strong>02 6280 4700</strong>.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              window.scrollTo({ top: 0, behavior: 'smooth' });
              onBack();
            }}
            disabled={isSubmitting}
          >
            ← Back to Edit
          </Button>
          <div className="flex space-x-3">
            {currentTab < 3 && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setCurrentTab(currentTab + 1);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              >
                Next Tab →
              </Button>
            )}
            <Button
              type="button"
              onClick={onConfirm}
              disabled={isSubmitting}
              className="bg-green-500 hover:bg-green-600"
            >
              {isSubmitting ? "Submitting..." : "Confirm & Submit"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
