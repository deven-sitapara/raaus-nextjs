// Common Types
export type RoleType =
  | "Pilot in Command"
  | "Owner"
  | "L1"
  | "L2"
  | "LAME"
  | "Maintenance Personnel"
  | "Witness"
  | "Other";

export type AustralianState = "ACT" | "NSW" | "NT" | "QLD" | "SA" | "TAS" | "VIC" | "WA";

export type RegistrationPrefix =
  | "--"
  | "E24"
  | "E23"
  | "10"
  | "17"
  | "18"
  | "19"
  | "23"
  | "24"
  | "25"
  | "26"
  | "28"
  | "29"
  | "32"
  | "34"
  | "55";

export type AircraftType =
  | "Three Axis Aeroplane"
  | "Weight-Shift Controlled Aeroplane"
  | "Powered Parachute";

export type RegistrationStatus =
  | "-None-"
  | "Allocated Number"
  | "Blocked"
  | "Deregistered"
  | "Destroyed"
  | "Full Registration"
  | "Provisional Registration"
  | "Suspended"
  | "Cancelled";

export type MaintainerLevel = "Level 1 Maintainer (L1)" | "Level 2 Maintainer (L2)" | "Level 4 Maintainer (L4)";

// Form 1: Accident/Incident Report Types (Using exact CRM API field names)
export interface AccidentFormData {
  // Reporter / Person submitting
  Name1?: string; // First name
  Role?: RoleType;
  Member_Number?: string;
  Reporter?: string;
  Reporter_Email?: string;
  Contact_Phone?: string;
  Last_Name?: string;

  // PIC (Pilot in Command)
  PIC_Name?: string;
  PIC_Contact_Phone?: string;
  PIC_Email?: string;
  Date_of_Birth?: string;
  PIC_Member_Number?: string;
  PIC_Last_Name?: string;

  // Experience
  Hours_last_90_days?: string;
  Hours_on_type?: string;
  Hours_on_type_last_90_days?: string;
  Total_flying_hours?: string;
  Registration_status?: RegistrationStatus;

  // Occurrence details
  Occurrence_Date1?: string;
  Location?: string;
  State?: AustralianState;
  Occurrence_Type?: string;
  Is_this_occurrence_an_Accident_or_an_Incident?: "Accident" | "Incident";
  Description_of_damage_to_aircraft?: string;
  Accident_or_Incident?: "Accident" | "Incident";
  Reporter_Suggestions?: string;
  Name_of_Flight_Training_School?: string;
  Involve_IFR_or_Air_Transport_Operations?: boolean | "Yes" | "No";
  Involve_near_miss_with_another_aircraft?: boolean | "Yes" | "No";
  In_controlled_or_special_use_airspace?: boolean | "Yes" | "No";
  Bird_or_Animal_Strike?: boolean | "Yes" | "No";

  // Aircraft details
  Make1?: string;
  Registration_number?: string;
  Engine_model?: string;
  Engine_serial?: string;
  Engine_Details?: string;
  Year_Built1?: string;
  Total_airframe_hours?: string;
  Total_engine_hours?: string;
  Total_hours_since_service?: string;
  Propeller_make?: string;
  Propeller_model?: string;
  Propeller_serial?: string;
  Model?: string;
  Serial_number?: string;
  Serial_number1?: string;
  Type1?: AircraftType;

  // Operations / Environment
  Type_of_operation?: string;
  Phase_of_flight?: string;
  Effect_of_flight?: string;
  Flight_Conditions?: string;
  Flight_Rules?: "VFR" | "IFR" | "Unknown";
  Airspace_class?: "A" | "C" | "D" | "E" | "G" | "Unknown";
  Airspace_type?: "CTA" | "CTR" | "CAF" | "OCTA" | "PRD" | "OCA";
  Altitude?: string;
  Altitude_type?: "AMSL (Above mean sea level)" | "AGL (Above ground level)" | "Surface" | "Unknown";
  Light_conditions?: "Dawn" | "Daylight" | "Dusk" | "Night" | "Unknown";
  Visibility?: string;
  Temperature?: string;
  Visibility_reduced_by?: "Cloud" | "Fog" | "Smoke" | "Haze" | "Unknown";
  Wind_direction?: "N" | "NE" | "E" | "SE" | "S" | "SW" | "W" | "NW";
  Wind_speed?: string;
  Wind_gusting?: "Not sure" | "Yes" | "No";

  // Injury / Damage
  Passenger_details?: string;
  Passenger_injury?: "Fatal" | "Serious" | "Minor" | "Nil" | "Unknown";
  Persons_on_the_ground_injury?: "Fatal" | "Serious" | "Minor" | "Nil" | "Unknown";
  Most_serious_injury_to_pilot?: "Fatal" | "Serious" | "Minor" | "Nil" | "Unknown";
  Damage_to_aircraft?: "Destroyed" | "Major" | "Minor" | "Nil" | "Unknown";

  // Flight movement
  Departure_location?: string;
  Destination_location?: string;
  Landing?: string;

  // Narratives / Classifications
  Details_of_incident_accident?: string;
  Provide_description_of_defect?: string;
  Summary_of_actions_taken_to_be_provided?: string;
  Classification_level?: string;
  ATSB_reportable_status?: string;

  // Personal Locator Beacon
  PLB_Activated?: "Yes" | "No";
  Personal_Locator_Beacon_carried?: "Yes" | "No";

  // Maintainer info
  Maintainer_Name?: string;
  Maintainer_Last_Name?: string;
  Maintainer_Level?: MaintainerLevel;
  Maintainer_Member_Number?: string;

  // Wildlife strike details
  Type_of_strike?: "Bird" | "Animal" | "Unknown";
  Number_approx?: "1" | "2-10" | ">10" | "Unknown";
  Species?: string;
  Size?: "Small" | "Medium" | "Large" | "Unknown";
  Number_struck_approx?: "1" | "2-10" | ">10" | "Unknown";

  // Near-aircraft collision details
  Second_aircraft_registration?: string;
  Second_Aircraft_Manufacturer?: string;
  Second_Aircraft_Model?: string;
  Horizontal_Proximity?: string;
  Horizontal_Proximity_Unit?: "Metres (m)" | "Nautical Miles (nm)" | "Minutes";
  Vertical_Proximity?: string;
  Vertical_Proximity_Unit?: "Feet (ft)" | "Metres (m)";
  Relative_Track?: "Converging" | "Crossing" | "Diverging" | "Reciprocal" | "Same Track" | "Other" | "Unknown";
  Avoidance_manoeuvre_needed?: "Yes" | "No" | "Unknown";
  Alert_Received?: "ATC Verbal" | "TCAS RA" | "TCAS TA" | "Other" | "None" | "Unknown";

  // Attachments
  attachments?: File[];

  // Legacy field names for backward compatibility
  role?: RoleType;
  memberNumber?: string;
  contactPhone?: string;
  pilotContactPhone?: string;
  firstName?: string;
  lastName?: string;
  emailAddress?: string;
  occurrenceDate?: string;
  location?: string;
  state?: AustralianState;
  detailsOfIncident?: string;
}

// Form 2: Defect Report Types (Using exact CRM API field names)
export interface DefectFormData {
  // Person Reporting
  Role: RoleType;
  Name1: string;
  Member_Number?: string;
  Reporter_First_Name?: string; // Alternative field name
  Reporter_Email?: string;
  Contact_Phone?: string;
  Last_Name: string;
  Postcode?: string;

  // Defect Information
  Occurrence_Date1: string; // Date defect identified
  Location_of_aircraft_when_defect_was_found?: string;
  Location?: string; // Alternative location field
  State?: AustralianState;
  Storage_conditions?: string;
  Description_of_Occurrence?: string;
  Defective_component?: string;
  Provide_description_of_defect?: string;
  
  // Damage Information
  Damage_to_aircraft?: string;
  Part_of_aircraft_damaged?: string;
  Description_of_damage_to_aircraft?: string;

  // Maintainer Information
  Maintainer_Name?: string;
  Maintainer_Member_Number?: string;
  Maintainer_Level?: MaintainerLevel;
  Do_you_have_further_suggestions_on_how_to_PSO?: string; // Prevention suggestions

  // Aircraft Information
  Registration_number?: string;
  Registration_status?: RegistrationStatus;
  Serial_number?: string;
  Make1?: string;
  Model?: string;
  Type1?: AircraftType;
  Year_Built1?: string;

  // Engine Details (as applicable)
  Engine_Details?: string;
  Engine_model?: string;
  Engine_serial?: string;
  Total_engine_hours?: string;
  Total_hours_since_service?: string;

  // Propeller Details (as applicable)
  Propeller_make?: string;
  Propeller_model?: string;
  Propeller_serial?: string;

  // Training Usage
  Is_the_aircraft_used_for_training_purposes?: boolean;

  // Legacy fields for backward compatibility
  role?: RoleType;
  memberNumber?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  contactPhone?: string;
  dateDefectIdentified?: string;
  state?: AustralianState;
  locationOfAircraft?: string;
  defectiveComponent?: string;
  defectDescription?: string;
  maintainerName?: string;
  maintainerMemberNumber?: string;
  maintainerLevel?: MaintainerLevel;
  preventionSuggestions?: string;
  registrationNumberPrefix?: RegistrationPrefix;
  registrationNumberSuffix?: string;
  serialNumber?: string;
  registrationStatus?: RegistrationStatus;
  make?: string;
  model?: string;
  yearBuilt?: string;
  type?: AircraftType;
  engineMake?: string;
  engineModel?: string;
  engineSerial?: string;
  totalEngineHours?: string;
  totalHoursSinceService?: string;
  propellerMake?: string;
  propellerModel?: string;
  propellerSerial?: string;

  // Attachments
  attachments?: File[];
}

// Form 3: Complaint Types (Using exact CRM API field names)
export interface ComplaintFormData {
  // Person Reporting
  Role: RoleType;
  Member_Number?: string;
  Name1: string;
  Last_Name: string;
  Contact_Phone?: string;
  Reporter_Email?: string;

  // Complaint Information
  Occurrence_Date1: string;
  Description_of_Occurrence: string;
  attachments?: File[];
  wishToRemainAnonymous: boolean;
}

// Form 4: Hazard Report Types (Using exact CRM API field names)
export interface HazardFormData {
  // Person Reporting
  Role: RoleType;
  Member_Number?: string;
  Reporter_First_Name?: string; // Alternative field name
  Contact_Phone?: string;
  Reporter_Email?: string;
  Last_Name: string;
  Name1: string;

  // Hazard Information
  Date_Hazard_Identified?: string;
  Occurrence_Date1?: string; // Alternative date field
  Time?: string;
  Location_of_hazard?: string; // CRM field name
  Location_of_Hazard?: string; // Alternative field name
  Location?: string; // Generic location field
  State?: AustralianState;
  Description_of_Occurrence?: string;
  Reporter_Suggestions?: string;

  // Additional Hazard Fields
  Hazard_Description?: string;
  Please_fully_describe_the_identified_hazard?: string; // CRM field name
  Do_you_have_further_suggestions_on_how_to_PSO?: string;
  Potential_Consequences_of_Hazard?: string; // CRM field name
  
  // Attachments
  attachments?: File[];
}

// Form Configuration
export interface FormConfig {
  id: string;
  uniqueId: string;
  title: string;
  submitLabel: string;
  confirmLabel: string;
  editLabel: string;
}

// Zoho Response Types
export interface ZohoAuthResponse {
  access_token: string;
  api_domain: string;
  token_type: string;
  expires_in: number;
}

export interface ZohoCRMResponse {
  data: Array<{
    code: string;
    details: {
      id: string;
    };
    message: string;
    status: string;
  }>;
}

export interface ZohoWorkDriveUploadResponse {
  data: Array<{
    id: string;
    attributes: {
      name: string;
      size: number;
    };
  }>;
}
