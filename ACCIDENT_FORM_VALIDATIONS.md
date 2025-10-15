# Accident Form Field Validations

This document outlines all field validations implemented for the Accident/Incident Report form.

## Updated on: October 10, 2025

---

## Validation Patterns (lib/validations/patterns.ts)

### Core Patterns
- **name**: `/^[a-zA-Z ]{3,30}$/` - Letters and spaces only, 3-30 characters
- **memberNumber**: `/^\d{6}$/` - Exactly 6 digits (no more, no less)
- **registrationSuffix**: `/^\d{4}$/` - Exactly 4 digits
- **decimalNumber**: `/^\d+(\.\d+)?$/` - Supports integers and decimals (e.g., 12.2, 850.3)
- **alphanumericWithSpaces**: `/^[a-zA-Z0-9\s]*$/` - Alphanumeric with spaces
- **alphanumericDashSpace**: `/^[a-zA-Z0-9 -]{3,16}$/` - Alphanumeric with spaces and hyphens, 3-16 chars
- **numbersOnly**: `/^[0-9]+$/` - Integers only

---

## Step 1: Pilot Information

### Person Reporting Section

#### Member Number
- **Validation**: Numbers only, exactly 6 digits
- **Pattern**: `validationPatterns.memberNumber`
- **Min Length**: 6 characters
- **Max Length**: 6 characters
- **Input Restriction**: Only allows typing numbers (0-9), prevents letters and special characters
- **Error Message**: "Must be exactly 6 digits"
- **Placeholder**: "123456"
- **Real-time**: Validates against Zoho CRM database

#### First Name
- **Validation**: Letters and spaces only, 3-30 characters
- **Pattern**: `validationPatterns.name`
- **Min Length**: 3 characters
- **Max Length**: 30 characters
- **Required**: Yes
- **Error Message**: "Must be 3-30 characters, letters and spaces only"
- **Placeholder**: "John"

#### Last Name
- **Validation**: Letters and spaces only, 3-30 characters
- **Pattern**: `validationPatterns.name`
- **Min Length**: 3 characters
- **Max Length**: 30 characters
- **Required**: Yes
- **Error Message**: "Must be 3-30 characters, letters and spaces only"
- **Placeholder**: "Doe"

#### Email Address
- **Validation**: RFC 5322 compliant email
- **Function**: `validateEmail()`
- **Required**: Yes
- **Error Message**: "Please enter a valid email address (e.g., user@example.com)"
- **Placeholder**: "example@domain.com"

#### Contact Phone
- **Validation**: Country-specific phone validation
- **Countries Supported**: AU, CA, GB
- **Required**: Yes
- **Default Country**: AU
- **Error Message**: Country-specific (e.g., "Please enter a valid Australian phone number")
- **Placeholder**: "0412 345 678"

### Pilot in Command Section (Conditional - Hidden if reporter role is "Pilot in Command")

#### Member Number
- **Validation**: Numbers only, exactly 6 digits
- **Pattern**: `validationPatterns.memberNumber`
- **Min Length**: 6 characters
- **Max Length**: 6 characters
- **Input Restriction**: Only allows typing numbers (0-9), prevents letters and special characters
- **Error Message**: "Must be exactly 6 digits"
- **Help Text**: "Must be exactly 6 digits. If the pilot was not a member, leave blank."
- **Real-time**: Validates against Zoho CRM database

#### Date of Birth
- **Type**: Date
- **Min**: 1900-01-01
- **Max**: Current date
- **Required**: No

#### First Name
- **Validation**: Letters and spaces only, 3-30 characters
- **Pattern**: `validationPatterns.name`
- **Min Length**: 3 characters
- **Max Length**: 30 characters
- **Error Message**: "Must be 3-30 characters, letters and spaces only"
- **Placeholder**: "John"

#### Last Name
- **Validation**: Letters and spaces only, 3-30 characters
- **Pattern**: `validationPatterns.name`
- **Min Length**: 3 characters
- **Max Length**: 30 characters
- **Error Message**: "Must be 3-30 characters, letters and spaces only"
- **Placeholder**: "Doe"

#### Contact Phone
- **Validation**: Country-specific phone validation
- **Countries Supported**: AU, CA, GB
- **Default Country**: AU

#### Email
- **Validation**: RFC 5322 compliant email
- **Function**: `validateEmail()`
- **Error Message**: "Please enter a valid email address"

### Flying Hours Section

#### Hours Last 90 Days
- **Validation**: Decimal number
- **Pattern**: `validationPatterns.decimalNumber`
- **Max Length**: 10 characters
- **Type**: Text (changed from number for better decimal support)
- **Error Message**: "Please enter a valid number (e.g., 12.2 or 850.3)"
- **Placeholder**: "45.2"
- **Example**: 45.2, 12, 850.3

#### Total Flying Hours
- **Validation**: Decimal number
- **Pattern**: `validationPatterns.decimalNumber`
- **Max Length**: 10 characters
- **Type**: Text
- **Error Message**: "Please enter a valid number (e.g., 12.2 or 850.3)"
- **Placeholder**: "5280.7"

#### Hours on Type
- **Validation**: Decimal number
- **Pattern**: `validationPatterns.decimalNumber`
- **Max Length**: 10 characters
- **Type**: Text
- **Error Message**: "Please enter a valid number (e.g., 12.2 or 850.3)"
- **Placeholder**: "850.3"

#### Hours on Type Last 90 Days
- **Validation**: Decimal number
- **Pattern**: `validationPatterns.decimalNumber`
- **Max Length**: 10 characters
- **Type**: Text
- **Error Message**: "Please enter a valid number (e.g., 12.2 or 850.3)"
- **Placeholder**: "25.5"

---

## Step 2: Occurrence Information

### Occurrence Details

#### Occurrence Date
- **Type**: Date
- **Required**: Yes
- **Min**: 1900-01-01
- **Max**: Current date
- **Validation**: Cannot be in the future
- **Error Message**: "Occurrence date cannot be in the future"

#### Occurrence Time
- **Type**: Time
- **Required**: Yes
- **Validation**: Cannot be in the future (if date is today)
- **Error Message**: "Occurrence time must be in the past"

#### State
- **Type**: Dropdown
- **Required**: Yes
- **Options**: ACT, NSW, NT, QLD, SA, TAS, VIC, WA
- **Error Message**: "This field cannot be blank."

#### Location
- **Validation**: Text field, 4-250 characters
- **Min Length**: 4 characters
- **Max Length**: 250 characters
- **Required**: Yes
- **Error Message**: "Invalid minimum characters length"
- **Placeholder**: "Enter location details"

#### Details of Incident/Accident
- **Validation**: Text area, 4-255 characters
- **Min Length**: 4 characters
- **Max Length**: 255 characters
- **Required**: Yes
- **Error Message**: "Invalid minimum characters length"

#### Damage to Aircraft
- **Type**: Dropdown
- **Required**: Yes
- **Options**: Destroyed, Minor, Nil, Unknown
- **Error Message**: "This field cannot be blank."

#### Most Serious Injury to Pilot
- **Type**: Dropdown
- **Required**: Yes
- **Options**: Fatal, Serious, Minor, Nil, Unknown
- **Error Message**: "This field cannot be blank."

#### Passenger Details
- **Validation**: Alphanumeric with spaces
- **Pattern**: `validationPatterns.alphanumericWithSpaces`
- **Max Length**: 100 characters
- **Error Message**: "Only alphanumeric characters allowed"
- **Placeholder**: "Please supply names of other passengers if applicable"

#### Description of Damage to Aircraft
- **Validation**: Text area, 4-255 characters
- **Min Length**: 4 characters
- **Max Length**: 255 characters
- **Required**: Yes
- **Error Message**: "Invalid minimum characters length"

#### Maintainer First Name
- **Validation**: Letters and spaces only, 3-30 characters
- **Pattern**: `validationPatterns.name`
- **Min Length**: 3 characters
- **Max Length**: 30 characters
- **Error Message**: "Entered value is invalid"
- **Placeholder**: "Robert Johnson"

#### Maintainer Member Number
- **Validation**: Numbers only, exactly 6 digits
- **Pattern**: `validationPatterns.memberNumber`
- **Min Length**: 6 characters
- **Max Length**: 6 characters
- **Input Restriction**: Only allows typing numbers (0-9), prevents letters and special characters
- **Error Message**: "Must be exactly 6 digits"
- **Placeholder**: "e.g. 123456"

### Flight Details Section

#### Departure Location
- **Validation**: Alphanumeric with spaces
- **Pattern**: `validationPatterns.alphanumericWithSpaces`
- **Max Length**: 50 characters
- **Error Message**: "Entered value is invalid"
- **Placeholder**: "Enter departure location"

#### Destination Location
- **Validation**: Alphanumeric with spaces
- **Pattern**: `validationPatterns.alphanumericWithSpaces`
- **Max Length**: 50 characters
- **Error Message**: "Entered value is invalid"
- **Placeholder**: "Enter destination location"

#### Landing
- **Validation**: Alphanumeric with spaces
- **Pattern**: `validationPatterns.alphanumericWithSpaces`
- **Max Length**: 50 characters
- **Error Message**: "Invalid minimum characters length"
- **Help Text**: "(if different to destination)"
- **Placeholder**: "Enter landing location"

#### Type of Operation
- **Type**: Dropdown
- **Required**: Yes
- **Options**: Flying Training – Dual, Flying Training – Solo, Private/Business, Sports Aviation
- **Error Message**: "This field cannot be blank."

### Airspace Section

#### Altitude
- **Validation**: Decimal number
- **Pattern**: `validationPatterns.decimalNumber`
- **Max Length**: 10 characters
- **Type**: Text
- **Error Message**: "Invalid minimum characters length"
- **Placeholder**: "200"

### Environment Section

#### Visibility
- **Validation**: Decimal number
- **Pattern**: `validationPatterns.decimalNumber`
- **Max Length**: 10 characters
- **Type**: Text
- **Suffix**: "NM"
- **Error Message**: "Invalid minimum characters length"
- **Placeholder**: "30.0"

#### Wind Speed
- **Validation**: Decimal number
- **Pattern**: `validationPatterns.decimalNumber`
- **Max Length**: 10 characters
- **Type**: Text
- **Suffix**: "knots"
- **Error Message**: "Invalid minimum characters length"
- **Placeholder**: "10.0"

#### Temperature
- **Validation**: Decimal number
- **Pattern**: `validationPatterns.decimalNumber`
- **Max Length**: 10 characters
- **Type**: Text
- **Suffix**: "°C"
- **Error Message**: "Invalid minimum characters length"
- **Placeholder**: "20.0"

#### Wind Gusting
- **Type**: Dropdown
- **Required**: Yes
- **Options**: Not sure, Yes, No
- **Error Message**: "This field cannot be blank."

#### Personal Locator Beacon carried
- **Type**: Dropdown
- **Required**: Yes
- **Options**: Yes, No
- **Error Message**: "This field cannot be blank."

### Bird/Animal Strike Section (Conditional)

#### Species
- **Validation**: Text field, minimum 2 characters
- **Min Length**: 2 characters
- **Max Length**: 50 characters
- **Error Message**: "Invalid minimum characters length"
- **Placeholder**: "Enter species name"

### Near Miss Section (Conditional)

#### Second Aircraft Registration
- **Validation**: Alphanumeric with spaces and hyphens, 3-16 characters
- **Pattern**: `validationPatterns.alphanumericDashSpace`
- **Min Length**: 3 characters
- **Max Length**: 16 characters
- **Error Message**: "Invalid minimum characters length"
- **Placeholder**: "10-1234 or VH-ABC"

#### Second Aircraft Manufacturer
- **Validation**: Alphanumeric with spaces and hyphens, 3-16 characters
- **Pattern**: `validationPatterns.alphanumericDashSpace`
- **Min Length**: 3 characters
- **Max Length**: 16 characters
- **Error Message**: "Invalid minimum characters length"
- **Placeholder**: "Cessna"

#### Second Aircraft Model
- **Validation**: Alphanumeric with spaces and hyphens, 3-16 characters
- **Pattern**: `validationPatterns.alphanumericDashSpace`
- **Min Length**: 3 characters
- **Max Length**: 16 characters
- **Error Message**: "Invalid minimum characters length"
- **Placeholder**: "172"

#### Horizontal Proximity
- **Validation**: Decimal number
- **Pattern**: `validationPatterns.decimalNumber`
- **Max Length**: 10 characters
- **Type**: Text
- **Error Message**: "Invalid minimum characters length"
- **Placeholder**: "e.g., 150"

#### Vertical Proximity
- **Validation**: Decimal number
- **Pattern**: `validationPatterns.decimalNumber`
- **Max Length**: 10 characters
- **Type**: Text
- **Error Message**: "Invalid minimum characters length"
- **Placeholder**: "e.g., 0.5"

---

## Step 3: Aircraft Information

### Aircraft Details

#### Registration Number Prefix
- **Type**: Dropdown
- **Required**: Yes
- **Options**: --, E24, E23, 10, 17, 18, 19, 23, 24, 25, 26, 28, 29, 32, 34, 55
- **Error Message**: "Registration number is required"

#### Registration Number Suffix
- **Validation**: Exactly 4 digits
- **Pattern**: `validationPatterns.registrationSuffix`
- **Min Length**: 4 characters
- **Max Length**: 4 characters
- **Input Restriction**: Only allows typing numbers (0-9), prevents letters and special characters
- **Required**: Yes
- **Error Message**: "Minimum 4 characters required" / "Must be exactly 4 digits"
- **Placeholder**: "1234"
- **Feature**: Auto-lookup aircraft data from Zoho CRM

#### Serial Number
- **Validation**: Text field, minimum 3 characters
- **Min Length**: 3 characters
- **Max Length**: 50 characters
- **Required**: Yes
- **Error Message**: "Invalid minimum characters length"

#### Make
- **Validation**: Text field, minimum 2 characters
- **Min Length**: 2 characters
- **Max Length**: 50 characters
- **Required**: Yes
- **Error Message**: "Invalid minimum characters length"

#### Model
- **Validation**: Text field, minimum 2 characters
- **Min Length**: 2 characters
- **Max Length**: 50 characters
- **Required**: Yes
- **Error Message**: "Invalid minimum characters length"

#### Registration Status
- **Type**: Dropdown
- **Required**: Yes
- **Options**: Allocated Number, Blocked, Deregistered, Destroyed, Full Registration, Provisional Registration, Suspended, Cancelled

#### Type
- **Type**: Dropdown
- **Required**: Yes
- **Options**: Three Axis Aeroplane, Weight-Shift Controlled Aeroplane, Powered Parachute

#### Year Built
- **Type**: Dropdown
- **Required**: Yes
- **Options**: 1935-2025 (years)

#### Total Airframe Hours
- **Validation**: Decimal number
- **Pattern**: `validationPatterns.decimalNumber`
- **Max Length**: 10 characters
- **Type**: Text
- **Error Message**: "Invalid minimum characters length"
- **Placeholder**: "200"

### Engine Details Section

#### Engine Make
- **Validation**: Text field, minimum 2 characters
- **Min Length**: 2 characters
- **Max Length**: 50 characters
- **Required**: Yes
- **Error Message**: "Invalid minimum characters length"

#### Engine Model
- **Validation**: Text field, minimum 2 characters
- **Min Length**: 2 characters
- **Max Length**: 50 characters
- **Error Message**: "Invalid minimum characters length"

#### Engine Serial
- **Validation**: Text field, minimum 2 characters
- **Min Length**: 2 characters
- **Max Length**: 50 characters
- **Error Message**: "Invalid minimum characters length"

#### Total Engine Hours
- **Validation**: Decimal number
- **Pattern**: `validationPatterns.decimalNumber`
- **Max Length**: 10 characters
- **Type**: Text
- **Error Message**: "Invalid minimum characters length"
- **Placeholder**: "200"

#### Total Hours Since Service
- **Validation**: Decimal number
- **Pattern**: `validationPatterns.decimalNumber`
- **Max Length**: 10 characters
- **Type**: Text
- **Error Message**: "Invalid minimum characters length"
- **Placeholder**: "103"

### Propeller Details Section

#### Propeller Make
- **Validation**: Text field, minimum 2 characters
- **Min Length**: 2 characters
- **Max Length**: 50 characters
- **Error Message**: "Invalid minimum characters length"

#### Propeller Model
- **Validation**: Text field, minimum 2 characters
- **Min Length**: 2 characters
- **Max Length**: 50 characters
- **Error Message**: "Invalid minimum characters length"

#### Propeller Serial
- **Validation**: Text field, minimum 2 characters
- **Min Length**: 2 characters
- **Max Length**: 50 characters
- **Error Message**: "Invalid minimum characters length"

### Attachments

#### File Upload
- **Max Files**: 5
- **Max Total Size**: 256MB
- **Accepted Formats**: Images, videos, PDFs, documents, audio files
- **Validation**: File count and total size validated client-side

---

## Key Features

### Real-time Validation
- Member numbers are validated against Zoho CRM database as user types
- Aircraft registration auto-lookup when prefix and suffix are provided
- Phone numbers validated based on selected country
- All fields validate on blur and show immediate feedback

### User-Friendly Error Messages
- Clear, descriptive error messages for each field
- Examples provided in placeholders
- Help text for complex fields
- Color-coded validation states (red for errors, green for success)

### Input Restrictions (Client-Side Prevention)
- **Numbers-only fields** (Member Number, Registration Suffix): Prevents typing letters/special characters
- **Automatic cleanup**: Removes invalid characters if pasted
- **maxLength enforcement**: Browser prevents typing beyond character limit
- **Real-time feedback**: Immediate validation as user types

### Data Type Conversions
- Numeric fields changed from `type="number"` to `type="text"` with pattern validation
- Better decimal number support (e.g., 12.2, 850.3, 5280.7)
- Prevents browser spinner UI that can be confusing
- More consistent validation across browsers

### Form Persistence
- All form data auto-saved to sessionStorage
- Data persists across page refreshes
- Cleared on successful submission
- Separate persistence for each form step

---

## Testing Checklist

- [ ] Member Number: Test with 5 digits (should fail), 7 digits (should fail), exactly 6 digits (should pass), letters (should fail)
- [ ] Names: Test with numbers (should fail), special characters (should fail), 2 chars (should fail), 31 chars (should fail)
- [ ] Email: Test invalid formats, missing @, missing domain
- [ ] Phone: Test for each country (AU, CA, GB)
- [ ] Hours fields: Test with decimals (45.2), integers (45), letters (should fail)
- [ ] Location: Test with 3 chars (should fail), 251 chars (should fail)
- [ ] Registration Suffix: Test with 3 digits (should fail), 5 digits (should fail), letters (should fail)
- [ ] Alphanumeric fields: Test with special characters (should fail)
- [ ] Required fields: Test submitting empty (should fail)
- [ ] Date/Time: Test future dates and times (should fail)

---

## Notes for Developers

1. All validation patterns are centralized in `lib/validations/patterns.ts`
2. Error messages are standardized in `validationMessages` object
3. Import both `validationPatterns` and `validationMessages` in form components
4. Use `maxLength` prop on Input components to prevent excessive input
5. Type="text" with pattern validation is preferred over type="number" for decimal support
6. Always test validation on both client and server side
7. Member validation and aircraft lookup are async operations - handle loading states

---

## Recent Enhancements (Completed)

- [x] **Member Number Input Restriction**: Only allows typing numbers (0-9), blocks letters and special characters
- [x] **Registration Suffix Input Restriction**: Only allows typing numbers (0-9) for the 4-digit suffix
- [x] **Name Field Input Restriction**: Only allows typing letters (a-z, A-Z) and spaces, blocks numbers and special characters
- [x] **Title Case Auto-Formatting**: First Name and Last Name fields automatically convert to Title Case (e.g., "varun kumar" → "Varun Kumar")
- [x] **Phone Number Validation**: Country-specific validation for Person Reporting (required) and Pilot in Command (optional)
- [x] **Age Validation**: Date of Birth field validates pilot must be at least 18 years old with dual protection (date picker max + validation)
- [x] **Phone Validation Error Handling**: Added fallback for undefined country codes

## Future Enhancements

- [ ] Add field-level character counters for text areas
- [ ] Implement progressive validation for more fields
- [ ] Add inline suggestions for common errors
- [ ] Add tooltips explaining validation requirements
- [ ] Implement accessibility features (ARIA labels, screen reader support)
