# Zoho CRM Setup Guide

Quick guide to generate a new refresh token for Zoho CRM API integration.

## Quick Start

### 1. Get Client ID & Secret from Zoho

Visit [Zoho API Console](https://api-console.zoho.com.au/) and create a new Server-based Application:

- **Client Name**: RAAus Forms
- **Homepage URL**: `http://localhost:3001`
- **Authorized Redirect URIs**: `http://localhost:3001/oauth/callback`

Copy the generated **Client ID** and **Client Secret**.

### 2. Update .env File

```bash
ZOHO_CRM_CLIENT_ID=your_client_id_here
ZOHO_CRM_CLIENT_SECRET=your_client_secret_here
```

### 3. Get Authorization URL

```bash
npm run zoho:token
```

This will display an authorization URL. Open it in your browser.

### 4. Authorize & Get Grant Token

1. Authorize the application in your browser
2. You'll be redirected to: `http://localhost:3001/oauth/callback?code=XXXXXXXXX`
3. Copy the `code` value from the URL (ignore the error page)

### 5. Generate Refresh Token

```bash
npm run zoho:token YOUR_GRANT_TOKEN
```

### 6. Update .env with Refresh Token

Add the generated refresh token to `.env`:

```bash
ZOHO_CRM_REFRESH_TOKEN=your_refresh_token_here
```

## Complete .env Template

```bash
# Zoho CRM Configuration (AU Region)
ZOHO_CRM_CLIENT_ID=1000.XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
ZOHO_CRM_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
ZOHO_CRM_REFRESH_TOKEN=1000.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
ZOHO_CRM_API_DOMAIN=https://www.zohoapis.com.au

# CRM Module Configuration
ZOHO_CRM_MODULE=Occurrence_Management

# Zoho WorkDrive Configuration (if needed)
ZOHO_WORKDRIVE_CLIENT_ID=your_workdrive_client_id_here
ZOHO_WORKDRIVE_CLIENT_SECRET=your_workdrive_client_secret_here
ZOHO_WORKDRIVE_REFRESH_TOKEN=your_workdrive_refresh_token_here
ZOHO_WORKDRIVE_FOLDER_ID=your_folder_id_here

# Application Settings
NEXT_PUBLIC_APP_URL=http://localhost:3001
```

## Troubleshooting

| Error | Solution |
|-------|----------|
| `invalid_code` | Grant token expired (10 min limit). Get a new one |
| `unauthorized_client` | Check Client ID/Secret and redirect URI |
| `access_denied` | Verify Zoho CRM permissions |

## Need More Help?

See detailed instructions in `scripts/README.md`
