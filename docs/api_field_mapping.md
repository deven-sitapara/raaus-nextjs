# Occurrence Module API Field Mapping

This document provides a quick reference for mapping form fields to Zoho CRM API field names.

## Reporter Information
| Form Field | API Field Name | Type | Required |
|------------|---------------|------|----------|
| First Name | `Name1` | Single Line | Yes |
| Last Name | `Last_Name` | Single Line | Yes |
| Member Number | `Member_Number` | Single Line | No |
| Phone | `Contact_Phone` | Single Line | Yes |
| Email | `Reporter_Email` | Email | Yes |
| Role | `Role` | Pick List | Yes |
| Role (Other) | `Role_Other` | Single Line | Conditional |

## Pilot Information (PIC)
| Form Field | API Field Name | Type | Required |
|------------|---------------|------|----------|
| First Name | `PIC_Name` | Single Line | Yes |
| Last Name | `PIC_Last_Name` | Single Line | Yes |
| Member Number | `PIC_Member_Number` | Number | No |
| Contact Phone | `PIC_Contact_Phone` | Phone | Yes |
| Email | `PIC_Email` | Email | Yes |
| Date of Birth | `Date_of_Birth` | DateTime | No |
| Total Flying Hours | `Total_flying_hours` | Single Line | No |
| Hours Last 90 Days | `Hours_last_90_days` | Single Line | No |
| Hours on Type | `Hours_on_type` | Single Line | No |
| Hours on Type Last 90 Days | `Hours_on_type_last_90_days` | Single Line | No |

## Occurrence Information
| Form Field | API Field Name | Type | Required |
|------------|---------------|------|----------|
| Occurrence Date | `Occurrence_Date1` | DateTime | Yes |
| Description | `Description_of_Occurrence` | Multi Line (Large) | Yes |
| Accident or Incident | `Is_this_occurrence_an_Accident_or_an_Incident` | Pick List | Yes |
| Location | `Location` | Single Line | No |
| State | `State` | Pick List | No |
| Latitude | `Latitude` | Single Line | No |
| Longitude | `Longitude` | Single Line | No |
| Phase of Flight | `Phase_of_flight` | Pick List | No |
| Light Conditions | `Light_conditions` | Pick List | No |
| Visibility | `Visibility` | Decimal | No |
| Wind Speed | `Wind_speed` | Decimal | No |
| Wind Direction | `Wind_direction` | Pick List | No |
| Wind Gusting | `Wind_gusting` | Pick List | No |

## Injury Information
| Form Field | API Field Name | Type | Required |
|------------|---------------|------|----------|
| Highest Injury | `Highest_Injury` | Pick List | No |
| Pilot Injury | `Most_serious_injury_to_pilot` | Pick List | No |
| Passenger Injury | `Passenger_injury` | Pick List | No |
| Ground Injury | `Persons_on_the_ground_injury` | Pick List | No |
| Passenger Name | `Passenger_details` | Single Line | No |

## Aircraft Information
| Form Field | API Field Name | Type | Required |
|------------|---------------|------|----------|
| Registration Number | `Registration_number` | Single Line | Yes |
| Manufacturer | `Make` | Single Line | No |
| Model | `Model` | Single Line | No |
| Serial Number | `Serial_number` | Single Line | No |
| Year Built | `Year_built` | Pick List | No |
| Total Airframe Hours | `Total_airframe_hours` | Decimal | No |
| Damage Level | `Damage_to_aircraft` | Pick List | No |
| Damage Description | `Description_of_damage_to_aircraft` | Multi Line (Small) | No |
| Part Damaged | `Part_of_aircraft_damaged1` | Pick List | No |

## Engine Information
| Form Field | API Field Name | Type | Required |
|------------|---------------|------|----------|
| Engine Make | `Engine_Details` | Single Line | No |
| Engine Model | `Engine_model` | Single Line | No |
| Engine Serial | `Engine_serial` | Single Line | No |
| Total Engine Hours | `Total_engine_hours` | Single Line | No |

## Propeller Information
| Form Field | API Field Name | Type | Required |
|------------|---------------|------|----------|
| Propeller Make | `Propeller_make` | Single Line | No |
| Propeller Model | `Propeller_model` | Single Line | No |
| Propeller Serial | `Propeller_serial` | Single Line | No |

## Bird/Animal Strike
| Form Field | API Field Name | Type | Required |
|------------|---------------|------|----------|
| Bird/Animal Strike | `Bird_or_Animal_Strike` | Boolean | No |
| Species | `Species` | Single Line | No |
| Size | `Size` | Pick List | No |
| Number (approx) | `Number_approx` | Pick List | No |
| Number Struck (approx) | `Number_struck_approx` | Pick List | No |
| Bird/Animal Activity | `Bird_or_animal_activity` | Pick List | No |
| Pilot Warned | `Was_the_pilot_warned_of_birds_or_animals` | Pick List | No |
| Type of Strike | `Type_of_strike` | Pick List | No |

## Near Collision
| Form Field | API Field Name | Type | Required |
|------------|---------------|------|----------|
| Near Miss | `Involve_near_miss_with_another_aircraft` | Boolean | No |
| Other Registration | `Second_aircraft_registration` | Single Line | No |
| Other Manufacturer | `Second_Aircraft_Manufacturer` | Single Line | No |
| Other Model | `Second_Aircraft_Model` | Single Line | No |
| Horizontal Proximity | `Horizontal_Proximity` | Number | No |
| Horizontal Unit | `Horizontal_Proximity_Unit` | Pick List | No |
| Vertical Proximity | `Vertical_Proximity` | Number | No |
| Vertical Unit | `Vertical_Proximity_Unit` | Pick List | No |
| Relative Track | `Relative_Track` | Pick List | No |
| Avoidance Needed | `Avoidance_manoeuvre_needed` | Pick List | No |

## Defect Information
| Form Field | API Field Name | Type | Required |
|------------|---------------|------|----------|
| Is Defect | `Defect` | Boolean | No |
| Date Identified | `Date_Defect_Identified` | DateTime | No |
| Location Found | `Location_of_aircraft_when_defect_was_found` | Single Line | No |
| Defect Description | `Provide_description_of_defect` | Multi Line (Small) | No |
| Defective Component | `Defective_component` | Single Line | No |
| Causal Factors | `Causal_Factors` | Multiselect | No |
| Contributing Factors | `Contributing_factors` | Multiselect | No |
| Maintainer First Name | `Maintainer_Name` | Single Line | No |
| Maintainer Last Name | `Maintainer_Last_Name` | Single Line | No |
| Maintainer Member Number | `Maintainer_Member_Number` | Single Line | No |
| Maintainer Level | `Maintainer_Level` | Pick List | No |

## Complaint Information
| Form Field | API Field Name | Type | Required |
|------------|---------------|------|----------|
| Is Complaint | `Complaint` | Boolean | No |
| Complaint Details | `Complaint_details` | Multi Line (Small) | No |

## File Uploads
| Form Field | API Field Name | Type | Required |
|------------|---------------|------|----------|
| File Upload | `File_Upload_1` | File Upload | No |
| WorkDrive Folder ID | `Occurrence_Workdrive_Folder_ID` | Single Line | No |
| WorkDrive ID | `Workdrive_ID` | Single Line | No |

## Operational Details
| Form Field | API Field Name | Type | Required |
|------------|---------------|------|----------|
| Type of Operation | `Type_of_operation` | Pick List | No |
| Flight Rules | `Flight_Rules` | Pick List | No |
| Flight Conditions | `Flight_Conditions` | Pick List | No |
| Departure Location | `Departure_location` | Single Line | No |
| Destination Location | `Destination_location` | Single Line | No |
| Altitude | `Altitude` | Number | No |
| Altitude Type | `Altitude_type` | Pick List | No |
| PLB Carried | `Personal_Locator_Beacon_carried` | Pick List | No |
| PLB Activated | `PLB_Activated` | Boolean | No |

## Usage Notes

1. **Field Names**: Use the exact API field names (case-sensitive) when submitting to Zoho CRM
2. **Required Fields**: Always validate required fields before submission
3. **Data Types**: Ensure form values match the expected data type
4. **DateTime Format**: Use ISO 8601 format for DateTime fields
5. **Pick Lists**: Validate against allowed values from Zoho CRM
6. **Boolean Fields**: Submit as `true` or `false`
7. **Multi-select**: Submit as comma-separated values

## Form-Specific Field Groups

### Form 1: Accident/Incident (Form ID: 115)
- Reporter Information
- Pilot Information
- Occurrence Information
- Injury Information
- Aircraft Information
- Engine Information
- Propeller Information
- Bird/Animal Strike (conditional)
- Near Collision (conditional)
- Operational Details
- File Uploads

### Form 2: Defect (Form ID: 121)
- Reporter Information
- Defect Information
- Aircraft Information
- Engine Information
- Propeller Information
- File Uploads

### Form 3: Complaint (Form ID: 123)
- Reporter Information
- Complaint Information
- File Uploads
