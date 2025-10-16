# RAAus Form Submission System

Next.js application for Recreational Aviation Australia (RAAus) form submissions with Zoho CRM and WorkDrive integration.

## Features

- ✅ Three form types: Accident/Incident, Defect, and Complaint reporting
- ✅ Multi-step form wizard for complex forms
- ✅ Real-time member number validation against Zoho CRM
- ✅ File upload to Zoho WorkDrive (max 25 files, 256MB total)
- ✅ Form validation with regex patterns
- ✅ Responsive design with Tailwind CSS
- ✅ TypeScript for type safety

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Form Handling**: React Hook Form + Zod
- **Date Picker**: react-datepicker
- **Phone Input**: react-phone-number-input
- **HTTP Client**: Axios
- **Integrations**: Zoho CRM & Zoho WorkDrive

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Zoho CRM account with API access
- Zoho WorkDrive account with API access

### Installation

1. Clone the repository:
\`\`\`bash
git clone <repository-url>
cd raaus-nextjs
\`\`\`

2. Install dependencies:
\`\`\`bash
npm install
\`\`\`

3. Create environment file:
\`\`\`bash
cp .env.example .env
\`\`\`

4. Configure environment variables in `.env`:
\`\`\`env
# Zoho CRM Configuration
ZOHO_CRM_CLIENT_ID=your_client_id
ZOHO_CRM_CLIENT_SECRET=your_client_secret
ZOHO_CRM_REFRESH_TOKEN=your_refresh_token
ZOHO_CRM_API_DOMAIN=https://www.zohoapis.com

# Zoho WorkDrive Configuration
ZOHO_WORKDRIVE_CLIENT_ID=your_workdrive_client_id
ZOHO_WORKDRIVE_CLIENT_SECRET=your_workdrive_client_secret
ZOHO_WORKDRIVE_REFRESH_TOKEN=your_workdrive_refresh_token
ZOHO_WORKDRIVE_FOLDER_ID=your_folder_id

# Application Settings
NEXT_PUBLIC_APP_URL=http://localhost:3000
\`\`\`

5. Run the development server:
\`\`\`bash
npm run dev
\`\`\`

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

\`\`\`
├── app/
│   ├── accident/          # Accident/Incident form (multi-step)
│   ├── defect/            # Defect report form
│   ├── complaint/         # Complaint form (implemented)
│   ├── api/
│   │   ├── validate-member/  # Member validation endpoint
│   │   ├── zoho-crm/         # CRM submission endpoint
│   │   └── zoho-workdrive/   # File upload endpoint
│   ├── layout.tsx
│   ├── page.tsx           # Home page with form links
│   └── globals.css
├── components/
│   ├── ui/                # Reusable UI components
│   │   ├── Input.tsx
│   │   ├── Select.tsx
│   │   ├── Textarea.tsx
│   │   ├── DatePicker.tsx
│   │   ├── PhoneInput.tsx
│   │   ├── FileUpload.tsx
│   │   ├── Checkbox.tsx
│   │   └── Button.tsx
│   └── forms/
│       └── FormWizard.tsx  # Multi-step form component
├── lib/
│   ├── utils/
│   │   └── cn.ts          # Tailwind class merger
│   ├── validations/
│   │   └── patterns.ts    # Validation regex patterns
│   └── zoho/
│       ├── auth.ts        # Zoho authentication
│       ├── crm.ts         # CRM operations
│       └── workdrive.ts   # File upload operations
├── types/
│   └── forms.ts           # TypeScript type definitions
├── docs/                  # Form specifications
├── CLAUDE.md             # Claude Code guidance
└── README.md
\`\`\`

## Form Specifications

### Form 1: Accident/Incident (Form ID: 115)
- 3-page wizard: Pilot Information → Occurrence Information → Aircraft Information
- Fields: 80+ including pilot details, occurrence info, aircraft data, environment conditions
- Special features: Bird/animal strike reporting, near collision details

### Form 2: Defect (Form ID: 121)
- Single-page form with sections
- Fields: Person reporting, defect info, aircraft/engine/propeller details
- Focus on maintenance and defect prevention

### Form 3: Complaint (Form ID: 123) ✅ Implemented
- Single-page form
- Fields: Reporter info, complaint details, anonymous option
- Conditional notice display for anonymous reporters

## Key Features

### Member Number Validation
When a member number is entered with first and last name, the system validates against Zoho CRM:
- Shows warning if no match found
- Validates name matches
- Non-blocking (form can still be submitted)

### File Upload
- Max 25 files per form
- Max 256MB total size
- Supported formats: Images, videos, documents, audio
- Uploads to Zoho WorkDrive
- Returns shareable links attached to CRM record

### Form Validation
- Client-side validation with React Hook Form
- Regex patterns for names, emails, phone numbers
- Required field validation
- Custom error messages

## Development

### Commands
\`\`\`bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
\`\`\`

### Adding New Forms
1. Create form page in \`app/[form-name]/page.tsx\`
2. Define types in \`types/forms.ts\`
3. Add validation patterns in \`lib/validations/patterns.ts\`
4. Use existing UI components from \`components/ui/\`
5. Use FormWizard for multi-step forms

## Zoho Integration

### Authentication
- Uses OAuth 2.0 refresh token flow
- Tokens cached for 1 hour (auto-refresh)
- Separate auth for CRM and WorkDrive

### CRM Submission
- POST to \`/api/zoho-crm\`
- Specify module (e.g., "Complaints", "Defects", "Accidents")
- Data mapped to CRM fields

### File Upload
- POST to \`/api/zoho-workdrive\`
- Files uploaded to configured folder
- Returns file IDs and shareable links

## Status

- ✅ Project setup complete
- ✅ UI components built
- ✅ Zoho integrations complete
- ✅ Complaint form implemented
- ⏳ Defect form (pending)
- ⏳ Accident/Incident form (pending)

## Contributing

Refer to CLAUDE.md for development guidance and architecture details.

## License

Proprietary - Recreational Aviation Australia
