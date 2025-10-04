# Quick Start Guide

## 🚀 Get Started in 3 Steps

### 1. Install Dependencies
\`\`\`bash
npm install
\`\`\`

### 2. Start Development Server
\`\`\`bash
npm run dev
\`\`\`

### 3. Open Browser
Visit: **http://localhost:3001** (or http://localhost:3000)

## 📝 What Works Now

### ✅ Complaint Form (Fully Functional)
- Navigate to `/complaint`
- Fill out person reporting details
- Enter complaint information
- Upload files (optional)
- Toggle anonymous reporting
- Submit to Zoho CRM

### ⏳ Other Forms (Coming Soon)
- `/defect` - Defect report form
- `/accident` - Accident/Incident form

## 🔑 Zoho Credentials

Already configured in `.env`:
- CRM API (AU Region) ✅
- Module: Occurrence_Management ✅
- WorkDrive: Needs configuration ⏳

## 🛠️ Development Commands

\`\`\`bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run linting
\`\`\`

## 📁 Project Structure Quick Reference

\`\`\`
app/
├── complaint/page.tsx     # ✅ Working form
├── defect/page.tsx        # ⏳ Placeholder
├── accident/page.tsx      # ⏳ Placeholder
└── api/
    ├── validate-member/   # Member validation
    ├── zoho-crm/         # CRM submission
    └── zoho-workdrive/   # File uploads

components/
├── ui/                   # Reusable components
└── forms/FormWizard.tsx  # Multi-step form

lib/
├── zoho/                 # Zoho integrations
└── validations/          # Validation patterns

types/forms.ts            # TypeScript definitions
\`\`\`

## 🎯 Key Features

- ✅ Member number validation
- ✅ File uploads (max 5 files, 256MB)
- ✅ Phone input (AU, CA, GB, US)
- ✅ Date/time picker
- ✅ Form validation
- ✅ Anonymous reporting
- ✅ Success confirmation

## 📖 Documentation

- **IMPLEMENTATION_STATUS.md** - What's done & what's next
- **README.md** - Full documentation
- **CLAUDE.md** - Architecture guide
- **docs/forms.md** - Form specifications

## 🔥 Quick Test

1. Go to http://localhost:3001/complaint
2. Fill in:
   - Role: Select any
   - First Name: Test
   - Last Name: User
   - Occurrence Date: Select today
   - Complaint Details: "Test complaint"
3. Click Submit

## 💡 Tips

- Member validation is non-blocking (warnings only)
- Anonymous mode shows conditional notice
- File upload has drag-and-drop support
- All fields have proper validation
- Check browser console for any errors

## 🆘 Troubleshooting

**Port 3000 already in use?**
- Server will auto-use port 3001

**Build errors?**
- Run `npm install` again
- Check Node.js version (18+)

**Zoho API errors?**
- Verify .env credentials
- Check network connectivity
- Ensure Zoho AU region is accessible

## 🎉 You're Ready!

The foundation is solid. Now you can:
1. Test the Complaint form
2. Implement Defect form (use Complaint as template)
3. Implement Accident form (use FormWizard)
4. Configure WorkDrive for file uploads

Happy coding! 🚀
