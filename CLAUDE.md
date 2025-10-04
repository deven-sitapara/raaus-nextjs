# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js application for RAAus (Recreational Aviation Australia) form submissions that integrate with Zoho CRM and Zoho WorkDrive. The application handles three main form types:

1. **Lodge a New Accident or Incident** (Form ID: 115)
2. **Lodge a New Defect** (Form ID: 121)
3. **Lodge a New Complaint** (Form ID: 123)

## Tech Stack

- **Framework**: Next.js (latest) with App Router
- **Styling**: Tailwind CSS
- **Backend Integrations**:
  - Zoho CRM for form submissions
  - Zoho WorkDrive for document uploads
- **Design**: Responsive, mobile-first

## Form Architecture

### Form 1: Accident/Incident Report (Form ID: 115, Form Key: y5w1mg)
- **Pages**: Pilot Information → Occurrence Information → Aircraft Information
- **Key Features**:
  - Multi-step wizard with 3 pages
  - Pilot details and flying hours tracking
  - Occurrence details with injury severity levels
  - Aircraft, engine, and propeller information
  - Environmental conditions (light, visibility, wind)
  - Bird/animal strike reporting
  - Near collision reporting
  - File attachments support

### Form 2: Defect Report (Form ID: 121, Form Key: 85263)
- **Sections**: Person Reporting → Defect Information → Aircraft Details → Engine/Propeller Details → Attachments
- **Key Features**:
  - Defect identification with location and state
  - Maintainer information (L1/L2/L4 levels)
  - Aircraft registration with prefix/suffix validation
  - Engine and propeller tracking
  - Suggestions for prevention

### Form 3: Complaint (Form ID: 123, Form Key: 79451)
- **Sections**: Person Reporting → Complaint Information
- **Key Features**:
  - Anonymous reporting option with conditional notice
  - Role-based reporting (Pilot in Command, Owner, L1, L2, LAME, Maintenance Personnel, Witness, Other)
  - Multiple file uploads (max 5 files, 256MB total)

## Form Validations

### Common Patterns
- **Name fields**: Regex `^[a-zA-Z -]{3,16}$` (3-16 characters, letters, spaces, hyphens)
- **Member Number**: 5-6 digit number validation
- **Phone**: Australia (AU), Canada (CA), Great Britain (GB), US supported
- **Email**: Standard email regex validation
- **Date Format**: MM/DD/YYYY h:mm A (with min date 01/01/1875)

### File Uploads
- **Max files**: 5 per form (Form 1: Accident), variable for others
- **Max size**: 256MB total
- **Accepted formats**: Images (jpg, jpeg, png, gif, bmp, tiff, webp), Videos (mp4, avi, mov, mkv), Documents (pdf, doc, docx, xls, xlsx, txt), Audio (mp3, wav, ogg)

### Registration Number
- **Prefix options**: --, E24, E23, 10-34, 55
- **Suffix**: 4-digit number

### State Options
Australian states: ACT, NSW, NT, QLD, SA, TAS, VIC, WA

## Member Number Validation

**Critical Feature**: When a Member Number is entered along with First Name and Last Name, the system must validate against existing Zoho CRM records. If no match is found, display an internal warning to the user.

## Form Submission Flow

1. User fills out multi-step form with client-side validation
2. On submit, show confirmation screen with all entered data
3. User can edit or confirm submission
4. On confirmation:
   - Submit form data to Zoho CRM
   - Upload attachments to Zoho WorkDrive
   - Display success/error message

## Documentation Files

- **docs/README.md**: Basic requirements and tech stack
- **docs/forms.md**: Detailed form field specifications with validation rules
- **docs/accident_fields.json**: Complete field definitions for Accident/Incident form
- **docs/Accident.html, Defect.html, complain.html**: Reference HTML forms from existing implementation
- **docs/internal.md**: Contains Zoho CRM credentials (DO NOT commit to version control)

## Development Notes

- Forms use conditional rendering (e.g., anonymous reporting notice only shows when checkbox is checked)
- Multi-page forms require state management across pages
- Form field IDs from JSON should map to CRM field IDs for submission
- Some fields are marked read-only (e.g., Engine Serial in defect form)
- Date pickers need to support date+time selection for occurrence dates
- Phone number fields require country code dropdown (default: AU)