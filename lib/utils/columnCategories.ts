/**
 * Column Category Definitions
 * Categorizes table columns into mandatory, important, and optional
 * with priority ordering for optimal data presentation
 */

export type ColumnCategory = 'mandatory' | 'important' | 'optional';

export interface ColumnMetadata {
  category: ColumnCategory;
  priority: number; // Lower number = higher priority (shown first)
  description?: string;
}

export interface CategoryConfig {
  label: string;
  color: string;
  badgeColor: string;
  textColor: string;
  borderColor: string;
}

export const CATEGORY_CONFIGS: Record<ColumnCategory, CategoryConfig> = {
  mandatory: {
    label: 'Mandatory Fields',
    color: '#fee2e2', // red-100
    badgeColor: 'bg-red-100',
    textColor: 'text-red-800',
    borderColor: 'border-red-300',
  },
  important: {
    label: 'Important Fields',
    color: '#fed7aa', // orange-100
    badgeColor: 'bg-orange-100',
    textColor: 'text-orange-800',
    borderColor: 'border-orange-300',
  },
  optional: {
    label: 'Optional Fields',
    color: '#fef3c7', // yellow-100
    badgeColor: 'bg-yellow-100',
    textColor: 'text-yellow-800',
    borderColor: 'border-yellow-300',
  },
};

/**
 * ACCIDENT FORM COLUMN CATEGORIES
 * Based on form requirements and data priority
 */
export const ACCIDENT_COLUMN_METADATA: Record<string, ColumnMetadata> = {
  // ===== MANDATORY FIELDS (Priority 1-20) =====
  // Core identifiers and critical data
  Type: { category: 'mandatory', priority: 1, description: 'Form type' },
  OccurrenceId: { category: 'mandatory', priority: 2, description: 'Unique identifier' },
  Occurrence_Date1: { category: 'mandatory', priority: 3, description: 'When incident occurred' },
  Name1: { category: 'mandatory', priority: 4, description: 'Reporter first name' },
  Last_Name: { category: 'mandatory', priority: 5, description: 'Reporter last name' },
  Passenger_injury: { category: 'mandatory', priority: 6, description: 'Passenger injury status - CRITICAL' },
  Reporter_Email: { category: 'mandatory', priority: 7, description: 'Contact email' },
  Contact_Phone: { category: 'mandatory', priority: 8, description: 'Contact phone' },
  State: { category: 'mandatory', priority: 9, description: 'Australian state' },
  Location: { category: 'mandatory', priority: 10, description: 'Incident location' },
  Description_of_Occurrence: { category: 'mandatory', priority: 11, description: 'What happened' },
  Damage_to_aircraft: { category: 'mandatory', priority: 12, description: 'Aircraft damage level' },
  Most_serious_injury_to_pilot: { category: 'mandatory', priority: 13, description: 'Pilot injury severity' },
  Accident_or_Incident: { category: 'mandatory', priority: 14, description: 'Classification' },

  // ===== IMPORTANT FIELDS (Priority 21-60) =====
  // High-value data for analysis and investigation
  Role: { category: 'important', priority: 22, description: 'Reporter role' },
  Member_Number: { category: 'important', priority: 23, description: 'Reporter member number' },
  Registration_number: { category: 'important', priority: 24, description: 'Aircraft registration' },
  Make1: { category: 'important', priority: 25, description: 'Aircraft manufacturer' },
  Model: { category: 'important', priority: 26, description: 'Aircraft model' },
  Type1: { category: 'important', priority: 27, description: 'Aircraft type' },
  
  // PIC Information
  PIC_Member_Number: { category: 'important', priority: 28, description: 'PIC member number' },
  PIC_Name: { category: 'important', priority: 29, description: 'PIC first name' },
  PIC_Last_Name: { category: 'important', priority: 30, description: 'PIC last name' },
  PIC_Contact_Phone: { category: 'important', priority: 31, description: 'PIC phone' },
  PIC_Email: { category: 'important', priority: 32, description: 'PIC email' },
  Date_of_Birth: { category: 'important', priority: 33, description: 'PIC date of birth' },
  
  // Flight hours
  Total_flying_hours: { category: 'important', priority: 34, description: 'Total flying experience' },
  Hours_last_90_days: { category: 'important', priority: 35, description: 'Recent flying hours' },
  Hours_on_type: { category: 'important', priority: 36, description: 'Experience on aircraft type' },
  Hours_on_type_last_90_days: { category: 'important', priority: 37, description: 'Recent hours on type' },
  
  // Contributing factors
  Level_2_Maintainer_L2: { category: 'important', priority: 38, description: 'Contributing factors' },
  Reporter_Suggestions: { category: 'important', priority: 39, description: 'Prevention suggestions' },
  ATSB_reportable_status: { category: 'important', priority: 40, description: 'Reporting status' },
  
  // Additional injury/damage info
  Persons_on_the_ground_injury: { category: 'important', priority: 41, description: 'Ground injury' },
  Description_of_damage_to_aircraft: { category: 'important', priority: 42, description: 'Damage description' },
  Passenger_details: { category: 'important', priority: 43, description: 'Passenger information' },
  
  // Maintainer info
  Maintainer_Name: { category: 'important', priority: 44, description: 'Maintainer first name' },
  Maintainer_Last_Name: { category: 'important', priority: 45, description: 'Maintainer last name' },
  Maintainer_Member_Number: { category: 'important', priority: 46, description: 'Maintainer member number' },
  Maintainer_Level: { category: 'important', priority: 47, description: 'Maintainer certification' },
  
  // Aerodrome & airspace
  In_vicinity_of_aerodrome: { category: 'important', priority: 48, description: 'Near aerodrome' },
  Y_Code: { category: 'important', priority: 49, description: 'Aerodrome code' },
  In_controlled_or_special_use_airspace: { category: 'important', priority: 50, description: 'Controlled airspace' },
  Involve_IFR_or_Air_Transport_Operations: { category: 'important', priority: 51, description: 'IFR/Transport ops' },
  
  // Near miss & wildlife
  Involve_near_miss_with_another_aircraft: { category: 'important', priority: 52, description: 'Near miss' },
  Bird_or_Animal_Strike: { category: 'important', priority: 53, description: 'Wildlife strike' },
  Type_of_strike: { category: 'important', priority: 54, description: 'Strike type' },
  Species: { category: 'important', priority: 55, description: 'Animal species' },
  
  // System fields
  Created_Time: { category: 'important', priority: 56, description: 'Record created' },
  
  // ===== OPTIONAL FIELDS (Priority 61+) =====
  // Supplementary data for detailed analysis
  
  // Flight operations
  Type_of_operation: { category: 'optional', priority: 61, description: 'Operation type' },
  Phase_of_flight: { category: 'optional', priority: 62, description: 'Flight phase' },
  Effect_of_flight: { category: 'optional', priority: 63, description: 'Flight effect' },
  Flight_Rules: { category: 'optional', priority: 64, description: 'VFR/IFR' },
  Departure_location: { category: 'optional', priority: 65, description: 'Departure point' },
  Destination_location: { category: 'optional', priority: 66, description: 'Destination' },
  Landing: { category: 'optional', priority: 67, description: 'Landing location' },
  
  // Airspace details
  Airspace_class: { category: 'optional', priority: 68, description: 'Airspace classification' },
  Airspace_type: { category: 'optional', priority: 69, description: 'Airspace type' },
  Altitude: { category: 'optional', priority: 70, description: 'Altitude' },
  Altitude_type: { category: 'optional', priority: 71, description: 'AMSL/AGL' },
  
  // Environmental conditions
  Light_conditions: { category: 'optional', priority: 72, description: 'Lighting' },
  Visibility: { category: 'optional', priority: 73, description: 'Visibility distance' },
  Visibility_reduced_by: { category: 'optional', priority: 74, description: 'Visibility factors' },
  Wind_speed: { category: 'optional', priority: 75, description: 'Wind speed' },
  Wind_direction: { category: 'optional', priority: 76, description: 'Wind direction' },
  Wind_gusting: { category: 'optional', priority: 77, description: 'Gusting conditions' },
  Temperature: { category: 'optional', priority: 78, description: 'Temperature' },
  Personal_Locator_Beacon_carried: { category: 'optional', priority: 79, description: 'PLB carried' },
  
  // Aircraft details
  Serial_number: { category: 'optional', priority: 80, description: 'Serial number' },
  Year_Built1: { category: 'optional', priority: 81, description: 'Year built' },
  Registration_status: { category: 'optional', priority: 82, description: 'Registration status' },
  Total_airframe_hours: { category: 'optional', priority: 83, description: 'Airframe hours' },
  
  // Engine details
  Engine_model: { category: 'optional', priority: 84, description: 'Engine model' },
  Engine_serial: { category: 'optional', priority: 85, description: 'Engine serial' },
  Engine_Details: { category: 'optional', priority: 86, description: 'Engine details' },
  Total_engine_hours: { category: 'optional', priority: 87, description: 'Engine hours' },
  Total_hours_since_service: { category: 'optional', priority: 88, description: 'Hours since service' },
  
  // Propeller details
  Propeller_make: { category: 'optional', priority: 89, description: 'Propeller make' },
  Propeller_model: { category: 'optional', priority: 90, description: 'Propeller model' },
  Propeller_serial: { category: 'optional', priority: 91, description: 'Propeller serial' },
  
  // Wildlife strike details
  Size: { category: 'optional', priority: 92, description: 'Strike size' },
  Number_approx: { category: 'optional', priority: 93, description: 'Number of animals' },
  Number_struck_approx: { category: 'optional', priority: 94, description: 'Number struck' },
  
  // Near miss details
  Second_aircraft_registration: { category: 'optional', priority: 95, description: '2nd aircraft rego' },
  Second_Aircraft_Manufacturer: { category: 'optional', priority: 96, description: '2nd aircraft make' },
  Second_Aircraft_Model: { category: 'optional', priority: 97, description: '2nd aircraft model' },
  Horizontal_Proximity: { category: 'optional', priority: 98, description: 'Horizontal separation' },
  Horizontal_Proximity_Unit: { category: 'optional', priority: 99, description: 'H proximity unit' },
  Vertical_Proximity: { category: 'optional', priority: 100, description: 'Vertical separation' },
  Vertical_Proximity_Unit: { category: 'optional', priority: 101, description: 'V proximity unit' },
  Relative_Track: { category: 'optional', priority: 102, description: 'Relative track' },
  Avoidance_manoeuvre_needed: { category: 'optional', priority: 103, description: 'Avoidance needed' },
  Alert_Received: { category: 'optional', priority: 104, description: 'Alert received' },
};

/**
 * DEFECT FORM COLUMN CATEGORIES
 */
export const DEFECT_COLUMN_METADATA: Record<string, ColumnMetadata> = {
  // Mandatory
  Type: { category: 'mandatory', priority: 1, description: 'Form type' },
  OccurrenceId: { category: 'mandatory', priority: 2, description: 'Defect ID' },
  Occurrence_Date1: { category: 'mandatory', priority: 3, description: 'Date identified' },
  Name1: { category: 'mandatory', priority: 4, description: 'Reporter first name' },
  Last_Name: { category: 'mandatory', priority: 5, description: 'Reporter last name' },
  Reporter_Email: { category: 'mandatory', priority: 6, description: 'Contact email' },
  Contact_Phone: { category: 'mandatory', priority: 7, description: 'Contact phone' },
  State: { category: 'mandatory', priority: 8, description: 'Australian state' },
  Location_of_aircraft_when_defect_was_found: { category: 'mandatory', priority: 9, description: 'Aircraft location' },
  Defective_component: { category: 'mandatory', priority: 10, description: 'Defective component' },
  Provide_description_of_defect: { category: 'mandatory', priority: 11, description: 'Defect description' },
  
  // Important
  Role: { category: 'important', priority: 21, description: 'Reporter role' },
  Member_Number: { category: 'important', priority: 22, description: 'Reporter member number' },
  Registration_number: { category: 'important', priority: 23, description: 'Aircraft registration' },
  Make1: { category: 'important', priority: 24, description: 'Aircraft manufacturer' },
  Model: { category: 'important', priority: 25, description: 'Aircraft model' },
  Maintainer_Name: { category: 'important', priority: 26, description: 'Maintainer first name' },
  Maintainer_Last_Name: { category: 'important', priority: 27, description: 'Maintainer last name' },
  Maintainer_Member_Number: { category: 'important', priority: 28, description: 'Maintainer member number' },
  Maintainer_Level: { category: 'important', priority: 29, description: 'Maintainer certification' },
  Do_you_have_further_suggestions_on_how_to_PSO: { category: 'important', priority: 30, description: 'Prevention suggestions' },
  Created_Time: { category: 'important', priority: 31, description: 'Record created' },
  
  // Optional
  Serial_number: { category: 'optional', priority: 61, description: 'Serial number' },
  Registration_status: { category: 'optional', priority: 62, description: 'Registration status' },
  Type1: { category: 'optional', priority: 63, description: 'Aircraft type' },
  Year_Built1: { category: 'optional', priority: 64, description: 'Year built' },
  Engine_Details: { category: 'optional', priority: 65, description: 'Engine details' },
  Engine_model: { category: 'optional', priority: 66, description: 'Engine model' },
  Engine_serial: { category: 'optional', priority: 67, description: 'Engine serial' },
  Total_engine_hours: { category: 'optional', priority: 68, description: 'Engine hours' },
  Total_hours_since_service: { category: 'optional', priority: 69, description: 'Hours since service' },
  Propeller_make: { category: 'optional', priority: 70, description: 'Propeller make' },
  Propeller_model: { category: 'optional', priority: 71, description: 'Propeller model' },
  Propeller_serial: { category: 'optional', priority: 72, description: 'Propeller serial' },
};

/**
 * HAZARD FORM COLUMN CATEGORIES
 */
export const HAZARD_COLUMN_METADATA: Record<string, ColumnMetadata> = {
  // Mandatory
  Type: { category: 'mandatory', priority: 1, description: 'Form type' },
  OccurrenceId: { category: 'mandatory', priority: 2, description: 'Hazard ID' },
  Date_Hazard_Identified: { category: 'mandatory', priority: 3, description: 'Date identified' },
  Name1: { category: 'mandatory', priority: 4, description: 'Reporter first name' },
  Last_Name: { category: 'mandatory', priority: 5, description: 'Reporter last name' },
  Reporter_Email: { category: 'mandatory', priority: 6, description: 'Contact email' },
  Contact_Phone: { category: 'mandatory', priority: 7, description: 'Contact phone' },
  State: { category: 'mandatory', priority: 8, description: 'Australian state' },
  Location_of_hazard: { category: 'mandatory', priority: 9, description: 'Hazard location' },
  Please_fully_describe_the_identified_hazard: { category: 'mandatory', priority: 10, description: 'Hazard description' },
  
  // Important
  Role: { category: 'important', priority: 21, description: 'Reporter role' },
  Member_Number: { category: 'important', priority: 22, description: 'Reporter member number' },
  Do_you_have_further_suggestions_on_how_to_PSO: { category: 'important', priority: 23, description: 'Prevention suggestions' },
  Created_Time: { category: 'important', priority: 24, description: 'Record created' },
};

/**
 * COMPLAINT FORM COLUMN CATEGORIES
 */
export const COMPLAINT_COLUMN_METADATA: Record<string, ColumnMetadata> = {
  // Mandatory
  Type: { category: 'mandatory', priority: 1, description: 'Form type' },
  OccurrenceId: { category: 'mandatory', priority: 2, description: 'Complaint ID' },
  Occurrence_Date1: { category: 'mandatory', priority: 3, description: 'Occurrence date' },
  Name1: { category: 'mandatory', priority: 4, description: 'Reporter first name' },
  Last_Name: { category: 'mandatory', priority: 5, description: 'Reporter last name' },
  Description_of_Occurrence: { category: 'mandatory', priority: 6, description: 'Complaint details' },
  
  // Important
  Role: { category: 'important', priority: 21, description: 'Reporter role' },
  Member_Number: { category: 'important', priority: 22, description: 'Reporter member number' },
  Reporter_Email: { category: 'important', priority: 23, description: 'Contact email' },
  Contact_Phone: { category: 'important', priority: 24, description: 'Contact phone' },
  Created_Time: { category: 'important', priority: 25, description: 'Record created' },
};

/**
 * ALL FORMS (COMBINED VIEW) COLUMN CATEGORIES
 */
export const ALL_FORMS_COLUMN_METADATA: Record<string, ColumnMetadata> = {
  // Mandatory - common critical fields across all forms
  Type: { category: 'mandatory', priority: 1, description: 'Form type' },
  OccurrenceId: { category: 'mandatory', priority: 2, description: 'Unique ID' },
  Occurrence_Date1: { category: 'mandatory', priority: 3, description: 'Occurrence date' },
  Name1: { category: 'mandatory', priority: 4, description: 'First name' },
  Last_Name: { category: 'mandatory', priority: 5, description: 'Last name' },
  State: { category: 'mandatory', priority: 6, description: 'State' },
  Description_of_Occurrence: { category: 'mandatory', priority: 7, description: 'Description' },
  
  // Important
  Member_Number: { category: 'important', priority: 21, description: 'Member number' },
  Role: { category: 'important', priority: 22, description: 'Role' },
  Reporter_Email: { category: 'important', priority: 23, description: 'Email' },
  Contact_Phone: { category: 'important', priority: 24, description: 'Phone' },
  Location: { category: 'important', priority: 25, description: 'Location' },
  Registration_number: { category: 'important', priority: 26, description: 'Aircraft rego' },
  Make1: { category: 'important', priority: 27, description: 'Make' },
  Model: { category: 'important', priority: 28, description: 'Model' },
  Accident_or_Incident: { category: 'important', priority: 29, description: 'Classification' },
  Damage_to_aircraft: { category: 'important', priority: 30, description: 'Damage' },
  Created_Time: { category: 'important', priority: 31, description: 'Created' },
  
  // Optional
  Defective_component: { category: 'optional', priority: 61, description: 'Defective component' },
  Level: { category: 'optional', priority: 62, description: 'Classification' },
  Occurence_Status: { category: 'optional', priority: 63, description: 'Status' },
  ATSB_reportable_status: { category: 'optional', priority: 64, description: 'ATSB status' },
  Modified_Time: { category: 'optional', priority: 65, description: 'Modified' },
};

/**
 * Get column metadata based on form type
 */
export function getColumnMetadata(formType: string): Record<string, ColumnMetadata> {
  switch (formType) {
    case 'Accident':
      return ACCIDENT_COLUMN_METADATA;
    case 'Defect':
      return DEFECT_COLUMN_METADATA;
    case 'Hazard':
      return HAZARD_COLUMN_METADATA;
    case 'Complaint':
      return COMPLAINT_COLUMN_METADATA;
    case 'All':
    default:
      return ALL_FORMS_COLUMN_METADATA;
  }
}

/**
 * Get columns organized by category
 */
export function getColumnsByCategory(
  columnKeys: string[],
  metadata: Record<string, ColumnMetadata>
): Record<ColumnCategory, string[]> {
  const categorized: Record<ColumnCategory, string[]> = {
    mandatory: [],
    important: [],
    optional: [],
  };

  columnKeys.forEach(key => {
    const meta = metadata[key];
    if (meta) {
      categorized[meta.category].push(key);
    } else {
      // Default to optional if not defined
      categorized.optional.push(key);
    }
  });

  // Sort each category by priority
  Object.keys(categorized).forEach(category => {
    categorized[category as ColumnCategory].sort((a, b) => {
      const priorityA = metadata[a]?.priority ?? 999;
      const priorityB = metadata[b]?.priority ?? 999;
      return priorityA - priorityB;
    });
  });

  return categorized;
}
