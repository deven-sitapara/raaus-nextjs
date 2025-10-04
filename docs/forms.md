# Forms

## Form 1 (Lodge a New Complaint)

### Person Reporting Section

| Field Name | Field Type | Required | Validation | Placeholder/Options |
|------------|------------|----------|------------|---------------------|
| Role | Select | Yes | - | Options: Pilot in Command, Owner, L1, L2, LAME, Maintenance Personnel, Witness, Other |
| Member Number | Number | No | Min/Max length: 6 characters | 123456 |
| First Name | Text | Yes | Regex: `^[a-zA-Z -]{3,16}$` | John |
| Last Name | Text | Yes | Regex: `^[a-zA-Z -]{3,16}$` | - |
| Contact Phone | Phone | No | Phone validation | 0412 345 678 (Default country: AU, supported: AU, CA, GB) |
| Email | Email | No | Email regex validation | example@domain.com |

### Complaint Information Section

| Field Name | Field Type | Required | Validation | Placeholder/Options |
|------------|------------|----------|------------|---------------------|
| Occurrence Date | Date | Yes | Date format: MM/DD/YYYY h:mm A<br>Range: 01/01/1875 - 10/03/2025<br>Default: Current date | 09/10/2025 12:00 AM |
| Complaint Details | Textarea | Yes | - | - |
| Attachments | File Upload | No | Max files: 5<br>Max size: 256MB<br>Accepted formats: Images (jpg, jpeg, png, gif, bmp, tiff, webp, etc.), Videos (mp4, avi, mov, mkv, etc.), Documents (pdf, doc, docx, xls, xlsx, txt, etc.), Audio (mp3, wav, ogg, etc.) | Description: "Upload photos and videos as evidence. Additionally include engine, propeller and airframe maintenance inspection documentation from logbooks as it pertains to the report." |
| Do you wish to remain anonymous? | Checkbox | No | - | - |

### Anonymous Reporting Notice

**Conditional Field (displays when anonymous checkbox is checked):**

> Reporter details will remain confidential from the complainant unless otherwise authorised. Reporters are encouraged to provide their details so that RAAus may make contact to obtain further information and assertain validity of the complaint. Where information is provided anonymously, however, it may not be possible for us to obtain further important details about the matter reported. This may result in the inability for RAAus to progress any review of the complaint provided.

### Form Metadata

- **Form ID:** 123
- **Form Unique ID:** 79451
- **Submit Button Label:** Submit
- **Confirmation Button Label:** Confirm
- **Edit Button Label:** Edit

CRM fields to be mapped: use the exact API names, case-sensitive
Use same fields name in our form to map with CRM fields.

'Role'              
'Member_Number'
'Name1'             
'Last_Name'
'Contact_Phone'
'Reporter_Email'
'Occurrence_Date1'
'Description_of_Occurrence'



## Form 2 (Lodge a New Defect)

### Person Reporting Section

| Field Name | Field Type | Required | Validation | Placeholder/Options |
|------------|------------|----------|------------|---------------------|
| Role | Select | Yes | - | Options: Pilot in Command, Owner, L1, L2, LAME, Maintenance Personnel, Witness, Other |
| Member Number | Number | No | Min length: 5, Max length: 6 | 123456 |
| First Name | Text | Yes | Regex: `^[a-zA-Z -]{3,16}$` | John |
| Last Name | Text | Yes | - | - |
| Email | Email | No | Email regex validation | example@domain.com |
| Contact Phone | Phone | Yes | Phone validation | 0412 345 678 (Default country: AU, supported: AU, CA, GB, US) |

### Defect Information Section

| Field Name | Field Type | Required | Validation | Placeholder/Options |
|------------|------------|----------|------------|---------------------|
| Date Defect Identified | Date | Yes | Date format: MM/DD/YYYY h:mm A<br>Range: 01/01/1875 - 10/04/2025 | - |
| State | Select | Yes | - | Options: ACT, NSW, NT, QLD, SA, TAS, VIC, WA (Default: NSW) |
| Location of Aircraft When Defect Was Found | Textarea | Yes | - | - |
| Defective Component | Text | Yes | - | Enter defective part name… |
| Provide Description of Defect | Textarea | Yes | - | Describe the problem (symptoms, damage, etc.)… |
| Maintainer Name | Text | No | Regex: `^[a-zA-Z\s]*$` | Robert Johnson |
| Maintainer Member Number | Number | No | - | e.g. 6789 |
| Maintainer Level | Select | No | - | Options: Level 1 Maintainer (L1), Level 2 Maintainer (L2), Level 4 Maintainer (L4) (Default: Level 2 Maintainer (L2)) |
| Do You Have Further Suggestions on How to Prevent Similar Occurrences? | Textarea | Yes | - | - |

**Note:** "If the defect resulted in additional damage to the aircraft, please provide details."

### Aircraft Information Section

| Field Name | Field Type | Required | Validation | Placeholder/Options |
|------------|------------|----------|------------|---------------------|
| Registration Number Prefix | Select | Yes | - | Options: --, E24, E23, 10, 17, 18, 19, 23, 24, 25, 26, 28, 29, 32, 34, 55 (Default: --) |
| Registration Number Suffix | Number | Yes | Min/Max length: 4 characters | 1234 |
| Serial Number | Text | Yes | - | - |
| Registration Status | Select | No | - | Options: -None-, Allocated Number, Blocked, Deregistered, Destroyed, Full Registration, Provisional Registration, Suspended, Cancelled (Default: -None-) |
| Make | Text | Yes | - | - |
| Model | Text | Yes | - | - |
| Year Built | Select | Yes | - | Options: 1935-2025 (Default: 1935) |
| Type | Select | Yes | - | Options: - Please select -, Three Axis Aeroplane, Weight-Shift Controlled Aeroplane, Powered Parachute (Default: - Please select -) |

### Engine Details Section
*(As applicable to defect report)*

| Field Name | Field Type | Required | Validation | Placeholder/Options |
|------------|------------|----------|------------|---------------------|
| Engine Make | Text | No | - | - |
| Engine Model | Text | No | - | - |
| Engine Serial | Number | No | - | Read-only field |
| Total Engine Hours | Text | No | Regex: `^[0-9]*$` | 200 |
| Total Hours Since Service | Text | No | Regex: `^[0-9]*$` | 102 |

### Propeller Details Section
*(As applicable to defect report)*

| Field Name | Field Type | Required | Validation | Placeholder/Options |
|------------|------------|----------|------------|---------------------|
| Propeller Make | Text | No | - | - |
| Propeller Model | Text | No | - | - |
| Propeller Serial | Text | No | Regex: `^[a-zA-Z0-9\s]*$` | Read-only field |

### Attachments Section

| Field Name | Field Type | Required | Validation | Placeholder/Options |
|------------|------------|----------|------------|---------------------|
| Attachments | File Upload | No | Max size: 256MB<br>Accepted formats: Images (jpg, jpeg, png, gif, bmp, tiff, webp, etc.), Videos (mp4, avi, mov, mkv, etc.), Documents (pdf, doc, docx, xls, xlsx, txt, etc.), Audio (mp3, wav, ogg, etc.) | Description: "Upload photos and videos as evidence. Additionally include engine, propeller and airframe maintenance inspection documentation from logbooks as it pertains to the report." |

### Form Metadata

- **Form ID:** 121
- **Form Unique ID:** 85263
- **Submit Button Label:** Submit
- **Confirmation Button Label:** Confirm
- **Edit Button Label:** Edit
