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

// Form 1: Accident/Incident Report Types
export interface AccidentFormData {
  // Person Reporting
  role: RoleType;
  memberNumber?: string;
  contactPhone: string;
  firstName: string;
  lastName: string;
  emailAddress?: string;

  // Pilot in Command
  pilotDateOfBirth?: string;
  pilotMemberNumber?: string;
  pilotFirstName?: string;
  pilotLastName?: string;
  pilotContactPhone?: string;
  pilotEmail?: string;
  totalFlyingHours?: string;
  hoursLast90Days?: string;
  hoursOnType?: string;
  hoursOnTypeLast90Days: string;

  // Occurrence Information
  occurrenceDate: string;
  location: string;
  state: AustralianState;
  detailsOfIncident: string;
  damageToAircraft: "Destroyed" | "Minor" | "Nil" | "Unknown";
  mostSeriousInjuryToPilot: "Fatal" | "Serious" | "Minor" | "Nil" | "Unknown";
  passengerDetails?: string;
  passengerInjury?: "Fatal" | "Serious" | "Minor" | "Nil" | "Unknown";
  personsOnGroundInjury?: "Fatal" | "Serious" | "Minor" | "Nil" | "Unknown";
  descriptionOfDamage: string;
  maintainerFirstName?: string;
  maintainerMemberNumber?: string;
  maintainerLastName?: string;
  maintainerLevel?: MaintainerLevel;
  isAccidentOrIncident: "Accident" | "Incident";
  whatContributed: string;
  preventionSuggestions: string;
  reportingMatter: "IRM" | "RRM";
  departureLocation?: string;
  attachments?: File[];

  // Environment
  lightConditions?: "Dawn" | "Daylight" | "Dusk" | "Night" | "Unknown";
  visibility?: number;
  temperature?: number;
  visibilityReducedBy?: "Cloud" | "Fog" | "Smoke" | "Haze" | "Unknown";
  windDirection?: "N" | "NE" | "E" | "SE" | "S" | "SW" | "W" | "NW";
  windSpeed?: number;
  windGusting: "Not sure" | "Yes" | "No";
  personalLocatorBeacon: "Yes" | "No";

  // Flight Details
  destinationLocation?: string;
  landing?: string;
  typeOfOperation: string;
  nameOfFlightTrainingSchool: string;
  phaseOfFlight?: string;
  effectOfFlight?: string;
  flightRules?: "VFR" | "IFR" | "Unknown";

  // Airspace
  airspaceClass?: "A" | "C" | "D" | "E" | "G" | "Unknown";
  airspaceType?: "CTA" | "CTR" | "CAF" | "OCTA" | "PRD" | "OCA";
  altitude?: number;
  altitudeType?: "AMSL (Above mean sea level)" | "AGL (Above ground level)" | "Surface" | "Unknown";

  // Aircraft Information
  registrationNumberPrefix: RegistrationPrefix;
  registrationNumberSuffix: string;
  make: string;
  model: string;
  registrationStatus: RegistrationStatus;
  type: AircraftType;
  yearBuilt: string;
  totalAirframeHours: number;
  serialNumber: string;

  // Engine Details
  engineMake: string;
  engineModel?: string;
  engineSerial?: string;
  totalEngineHours?: number;
  totalHoursSinceService?: number;

  // Propeller Details
  propellerMake?: string;
  propellerModel?: string;
  propellerSerial?: number;

  // Bird/Animal Strike
  didInvolveBirdAnimalStrike?: "Yes" | "No";
  typeOfStrike?: "Bird" | "Animal" | "Unknown";
  species?: string;
  numberApprox?: "1" | "2-10" | ">10" | "Unknown";
  numberStruckApprox?: "1" | "2-10" | ">10" | "Unknown";
  size?: "Small" | "Medium" | "Large" | "Unknown";

  // Near Miss
  didInvolveNearMiss: "Yes" | "No";
  secondAircraftRegistration?: string;
  secondAircraftManufacturer?: string;
  secondAircraftModel?: string;
  horizontalProximity?: number;
  horizontalProximityUnit?: "Metres (m)" | "Nautical Miles (nm)" | "Minutes";
  verticalProximity?: number;
  verticalProximityUnit?: "Feet (ft)" | "Metres (m)";
  relativeTrack?: "Converging" | "Crossing" | "Diverging" | "Reciprocal" | "Same Track" | "Other" | "Unknown";
  avoidanceManoeuvreNeeded?: "Yes" | "No" | "Unknown";
  alertReceived: "ATC Verbal" | "TCAS RA" | "TCAS TA" | "Other" | "None" | "Unknown";

  // Additional Questions
  didInvolveIFR?: "Yes" | "No";
  didOccurInControlledAirspace?: "Yes" | "No";
}

// Form 2: Defect Report Types
export interface DefectFormData {
  // Person Reporting
  role: RoleType;
  memberNumber?: string;
  firstName: string;
  lastName: string;
  email?: string;
  contactPhone: string;

  // Defect Information
  dateDefectIdentified: string;
  state: AustralianState;
  locationOfAircraft: string;
  defectiveComponent: string;
  defectDescription: string;
  maintainerName?: string;
  maintainerMemberNumber?: string;
  maintainerLevel?: MaintainerLevel;
  preventionSuggestions: string;

  // Aircraft Information
  registrationNumberPrefix: RegistrationPrefix;
  registrationNumberSuffix: string;
  serialNumber: string;
  registrationStatus?: RegistrationStatus;
  make: string;
  model: string;
  yearBuilt: string;
  type: AircraftType;

  // Engine Details (as applicable)
  engineMake?: string;
  engineModel?: string;
  engineSerial?: string;
  totalEngineHours?: string;
  totalHoursSinceService?: string;

  // Propeller Details (as applicable)
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
