# Zoho Integration Configuration Guide

This document explains how to configure the Zoho integration for the RAA Forms application.

## Overview

The application integrates with:
- **Zoho CRM** (Occurrence_Management module) for storing form submissions
- **Zoho WorkDrive** for organizing and storing file attachments

## Workflow

1. **Form Submission** → Creates record in CRM `Occurrence_Management` module
2. **OccurrenceId Generation** → CRM auto-generates unique occurrence ID
3. **WorkDrive Folder Creation** → Creates folder structure: `Parent_Folder/<OccurrenceId>/`
4. **File Upload** → Uploads attachments with original filenames to the OccurrenceId folder

## Authentication Options

### Option 1: Single Token (Recommended)
Use one OAuth app with combined scopes for both CRM and WorkDrive:

```env
ZOHO_CLIENT_ID=your_client_id
ZOHO_CLIENT_SECRET=your_client_secret
ZOHO_REFRESH_TOKEN=your_refresh_token_with_combined_scopes
```

**Required Scopes:**
- `ZohoCRM.modules.ALL`
- `ZohoCRM.settings.READ`
- `ZohoWorkDrive.files.ALL`
- `ZohoWorkDrive.workspace.READ`

### Option 2: Separate Tokens (Fallback)
Use separate OAuth apps for CRM and WorkDrive:

```env
# CRM specific
ZOHO_CRM_CLIENT_ID=crm_client_id
ZOHO_CRM_CLIENT_SECRET=crm_client_secret
ZOHO_CRM_REFRESH_TOKEN=crm_refresh_token

# WorkDrive specific
ZOHO_WORKDRIVE_CLIENT_ID=workdrive_client_id
ZOHO_WORKDRIVE_CLIENT_SECRET=workdrive_client_secret
ZOHO_WORKDRIVE_REFRESH_TOKEN=workdrive_refresh_token
```

## WorkDrive Configuration

### Parent Folder Setup
The `ZOHO_WORKDRIVE_PARENT_FOLDER_ID` should point to your team folder where occurrence folders will be created:

```
Team Folder: "Occurrence_Management" (ID: wi3c674a900ff8c884b088a22f539049c1ab2)
├── OCC-2025-001/
│   ├── accident_report.pdf
│   └── photos.jpg
├── OCC-2025-002/
│   ├── defect_description.doc
│   └── maintenance_log.pdf
└── OCC-2025-003/
    └── complaint_details.txt
```

### Finding Folder IDs
1. Navigate to your WorkDrive team folder
2. Copy the ID from the URL: `https://workdrive.zoho.com.au/folder/[FOLDER_ID]`
3. Or use the WorkDrive API to list folders

## Environment Variables

```env
# Single Token Approach (Primary)
ZOHO_CLIENT_ID=your_oauth_client_id
ZOHO_CLIENT_SECRET=your_oauth_client_secret
ZOHO_REFRESH_TOKEN=your_refresh_token

# API Configuration
ZOHO_CRM_API_DOMAIN=https://www.zohoapis.com.au
ZOHO_CRM_MODULE=Occurrence_Management

# WorkDrive Folder Structure
ZOHO_WORKDRIVE_PARENT_FOLDER_ID=your_team_folder_id

# Fallback Options (Optional)
ZOHO_CRM_CLIENT_ID=fallback_crm_client_id
ZOHO_CRM_CLIENT_SECRET=fallback_crm_client_secret
ZOHO_CRM_REFRESH_TOKEN=fallback_crm_refresh_token
ZOHO_WORKDRIVE_CLIENT_ID=fallback_workdrive_client_id
ZOHO_WORKDRIVE_CLIENT_SECRET=fallback_workdrive_client_secret
ZOHO_WORKDRIVE_REFRESH_TOKEN=fallback_workdrive_refresh_token
```

## Form Types and CRM Fields

### Accident Report (Form ID: 1)
- Sets `Accident: true` flag in CRM
- Maps standard occurrence fields

### Defect Report (Form ID: 2)
- Sets `Defect: true` flag in CRM
- Maps defect-specific fields

### Complaint Report (Form ID: 123)
- Sets `Complaint: true` flag in CRM
- Matches PHP implementation behavior

### Hazard Report (Form ID: 4)
- Sets `Hazard: true` flag in CRM
- Maps hazard identification fields

## API Endpoints

### Unified Form Submission
```
POST /api/submit-form
Content-Type: multipart/form-data

formType: "complaint" | "accident" | "defect" | "hazard"
formData: JSON string of form data
file_0: File (optional)
file_1: File (optional)
...
```

### Response Format
```json
{
  "success": true,
  "message": "Complaint form processed successfully",
  "recordId": "crm_record_id",
  "occurrenceId": "OCC-2025-001",
  "workdriveFolder": "workdrive_folder_id",
  "attachments": [
    {
      "fileId": "file_id",
      "fileName": "original_filename.pdf",
      "status": "uploaded_successfully"
    }
  ],
  "attachmentCount": 1,
  "timestamp": "2025-10-07T10:30:00.000Z"
}
```

## Error Handling

The system gracefully handles:
- **CRM failures**: Returns error immediately
- **OccurrenceId delays**: Retries with exponential backoff
- **WorkDrive failures**: Completes CRM submission with warning
- **File upload failures**: Reports per-file status

## Testing

1. **Environment**: Ensure all required variables are set
2. **CRM Access**: Test record creation in Occurrence_Management
3. **WorkDrive Access**: Test folder creation and file upload
4. **End-to-End**: Submit form with attachments and verify folder structure

## Troubleshooting

### Common Issues

1. **Token Scope Issues**
   - Ensure refresh token has both CRM and WorkDrive scopes
   - Check token permissions in Zoho Developer Console

2. **Folder Access Issues**
   - Verify parent folder ID is correct
   - Check WorkDrive permissions for OAuth user

3. **OccurrenceId Not Generated**
   - Check CRM workflow rules
   - Verify field permissions in CRM module

4. **File Upload Failures**
   - Check file size limits
   - Verify WorkDrive storage quota
   - Check file type restrictions