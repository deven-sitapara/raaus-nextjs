# RAAus Forms - Complete Setup Guide

Complete setup instructions for the RAAus Form Submission System with Zoho CRM and WorkDrive integration.

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installation](#installation)
3. [Zoho API Setup](#zoho-api-setup)
4. [Environment Configuration](#environment-configuration)
5. [Testing](#testing)
6. [Deployment](#deployment)

---

## Prerequisites

- Node.js 18+ installed
- Zoho CRM account (AU region)
- Zoho WorkDrive access
- Admin access to Zoho API Console

---

## Installation

```bash
# Clone the repository
cd raaus-nextjs

# Install dependencies
npm install

# Copy environment template
cp .env.example .env
```

---

## Zoho API Setup

### Step 1: Create API Client

1. Go to [Zoho API Console](https://api-console.zoho.com.au/)
2. Click **"Add Client"** → **"Server-based Applications"**
3. Fill in details:
   - **Client Name**: RAAus Forms
   - **Homepage URL**: `http://localhost:3000`
   - **Authorized Redirect URIs**: `http://localhost:3000/oauth/callback`
4. Click **"CREATE"**
5. Copy **Client ID** and **Client Secret**

### Step 2: Update .env with Credentials

```bash
ZOHO_CRM_CLIENT_ID=your_client_id_here
ZOHO_CRM_CLIENT_SECRET=your_client_secret_here

ZOHO_WORKDRIVE_CLIENT_ID=your_client_id_here  # Same as CRM
ZOHO_WORKDRIVE_CLIENT_SECRET=your_client_secret_here  # Same as CRM
```

### Step 3: Generate Combined Refresh Token

The token generator requests these scopes:
- `ZohoCRM.modules.ALL` - CRM access
- `WorkDrive.files.ALL` - WorkDrive file operations
- `WorkDrive.workspace.ALL` - WorkDrive workspace access

**Generate Token:**

```bash
# Step 1: Get authorization URL
npm run zoho:token

# Step 2: Open the URL in browser, authorize, and copy the code from redirect
# Redirect URL: http://localhost:3000/oauth/callback?code=YOUR_CODE

# Step 3: Generate refresh token
npm run zoho:token YOUR_CODE_HERE
```

**Update .env:**

```bash
ZOHO_CRM_REFRESH_TOKEN=your_refresh_token_here
ZOHO_WORKDRIVE_REFRESH_TOKEN=your_refresh_token_here  # Same token!
```

### Step 4: Get WorkDrive Folder ID

1. Go to [Zoho WorkDrive](https://workdrive.zoho.com.au)
2. Create a folder: **"RAAus Form Attachments"**
3. Open the folder and copy the ID from URL:
   ```
   https://workdrive.zoho.com.au/folder/wi3c6bb69a60ccee14c828111a1c46e1f3faa
                                            ↑ This is your Folder ID
   ```
4. Add to .env:
   ```bash
   ZOHO_WORKDRIVE_FOLDER_ID=wi3c6bb69a60ccee14c828111a1c46e1f3faa
   ```

---

## Environment Configuration

### Complete .env File

```bash
# Zoho CRM Configuration (AU Region)
ZOHO_CRM_CLIENT_ID=1000.XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
ZOHO_CRM_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
ZOHO_CRM_REFRESH_TOKEN=1000.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
ZOHO_CRM_API_DOMAIN=https://www.zohoapis.com.au

# CRM Module Configuration
ZOHO_CRM_MODULE=Occurrence_Management

# Zoho WorkDrive Configuration
ZOHO_WORKDRIVE_CLIENT_ID=1000.XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX  # Same as CRM
ZOHO_WORKDRIVE_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx  # Same as CRM
ZOHO_WORKDRIVE_REFRESH_TOKEN=1000.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx  # Same as CRM
ZOHO_WORKDRIVE_FOLDER_ID=wi3c6bb69a60ccee14c828111a1c46e1f3faa

# Application Settings
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Testing

### 1. Test Authentication

```bash
npm run test:auth
```

**Expected Output:**
```
✅ SUCCESS! Authentication working correctly
Access Token: 1000.xxx...
```

### 2. Test CRM Submission

```bash
# Start dev server
npm run dev

# In new terminal
npm run test:complaint
```

**Expected Output:**
```
✅ SUCCESS! Complaint submitted to Zoho CRM
Record ID: 87606000004358087
```

### 3. Test WorkDrive Upload

```bash
npm run test:workdrive
```

**Expected Output:**
```
✅ SUCCESS! File uploaded to Zoho WorkDrive
File IDs: xxxxx
Shareable Links: https://...
```

### 4. Test Full Form

1. Start dev server: `npm run dev`
2. Open: http://localhost:3000/complaint
3. Fill form with test data:
   - Role: Pilot in Command
   - Name: Test User
   - Date/Time: Any valid date
   - Complaint: Test submission
   - Upload: 1-2 test files
4. Submit and verify:
   - Success page appears
   - Check [Zoho CRM](https://crm.zoho.com.au) for record
   - Check [WorkDrive](https://workdrive.zoho.com.au) for files

---

## Field Mapping

### Complaint Form → Zoho CRM (Occurrence_Management)

| Form Field | CRM API Field | Required | Type |
|------------|---------------|----------|------|
| First Name | `Name1` | ✅ Yes | text |
| Last Name | `Last_Name` | ✅ Yes | text |
| Full Name (auto) | `Name` | ✅ Yes | text |
| Role | `Role` | ✅ Yes | picklist |
| Member Number | `Member_Number` | No | text |
| Contact Phone | `Contact_Phone` | No | phone |
| Email | `Reporter_Email` | No | email |
| Occurrence Date | `Occurrence_Date1` | ✅ Yes | datetime |
| Complaint Details | `Description_of_Occurrence` | ✅ Yes | textarea |
| Attachments | `attachmentLinks` | No | text |

### Date Format

- **Input**: Date picker (YYYY-MM-DD) + Time picker (HH:mm)
- **Output**: ISO 8601 with AU timezone: `2025-10-04T14:30:00+10:00`

---

## Troubleshooting

### Authentication Failed

```bash
# Check refresh token validity
npm run test:auth

# If invalid, regenerate
npm run zoho:token
```

### CRM Submission Failed

**Error: "INVALID_DATA"**
- Check date format is ISO 8601
- Verify all required fields are present

**Error: "MANDATORY_NOT_FOUND"**
- Missing required field (Name, Occurrence_Date1, etc.)

### WorkDrive Upload Failed

**Error: "Invalid OAuth token"**
- Refresh token doesn't have WorkDrive scopes
- Regenerate with all 3 scopes

**Error: "Folder not found"**
- Check ZOHO_WORKDRIVE_FOLDER_ID is correct
- Verify folder exists in WorkDrive

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run zoho:token` | Generate Zoho refresh token |
| `npm run test:auth` | Test authentication |
| `npm run test:complaint` | Test CRM submission |
| `npm run test:workdrive` | Test file upload |

---

## Production Deployment

### 1. Update Environment Variables

Update redirect URI and app URL for production:

```bash
# In Zoho API Console
Homepage URL: https://your-domain.com
Redirect URI: https://your-domain.com/oauth/callback

# In .env
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### 2. Regenerate Refresh Token

Use production redirect URI when generating token.

### 3. Deploy

```bash
npm run build
npm run start
```

---

## Security Notes

- ✅ Never commit `.env` file to version control
- ✅ Refresh tokens don't expire unless revoked
- ✅ Access tokens auto-refresh every hour
- ✅ Use environment variables for all credentials
- ✅ WorkDrive files are stored in private folder

---

## Support

For issues or questions:
- Check logs in dev server terminal
- Review error messages in browser console
- Test individual components using test scripts
- Verify Zoho CRM field names match exactly (case-sensitive)

---

## Summary

✅ **Setup Complete Checklist:**

- [ ] Node.js installed
- [ ] Dependencies installed (`npm install`)
- [ ] Zoho API Client created
- [ ] Client ID & Secret added to .env
- [ ] Refresh token generated (with all 3 scopes)
- [ ] WorkDrive Folder ID added to .env
- [ ] Authentication test passes
- [ ] CRM submission test passes
- [ ] WorkDrive upload test passes
- [ ] Full form test successful

🎉 **You're ready to go!**
