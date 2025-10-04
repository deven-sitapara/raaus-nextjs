# Zoho OAuth Token Generator

This script helps you generate a refresh token for Zoho CRM API access.

## Prerequisites

1. Zoho CRM account with API access
2. Client ID and Client Secret from Zoho API Console

## How to Get Client ID and Client Secret

1. Go to [Zoho API Console](https://api-console.zoho.com.au/)
2. Click "Add Client"
3. Select "Server-based Applications"
4. Fill in the details:
   - **Client Name**: RAAus Forms
   - **Homepage URL**: `http://localhost:3001`
   - **Authorized Redirect URIs**: `http://localhost:3001/oauth/callback`
5. Click "CREATE"
6. Copy the **Client ID** and **Client Secret**

## Steps to Generate Refresh Token

### Step 1: Update Environment Variables

Update your `.env` file with the new credentials:

```bash
ZOHO_CRM_CLIENT_ID=your_new_client_id_here
ZOHO_CRM_CLIENT_SECRET=your_new_client_secret_here
```

### Step 2: Get Authorization URL

Run the script without any parameters to get the authorization URL:

```bash
node scripts/generate-zoho-token.js
```

This will output an authorization URL. Copy and open it in your browser.

### Step 3: Authorize Application

1. You will be redirected to Zoho's authorization page
2. Select the duration (10 minutes is fine for setup)
3. Click "Accept"
4. You will be redirected to: `http://localhost:3001/oauth/callback?code=XXXXXXXXXX`
5. Copy the `code` parameter value (this is your grant token)

**Note**: The page will show an error because the callback URL doesn't exist locally - this is normal! Just copy the code from the URL.

### Step 4: Generate Refresh Token

Run the script again with your grant token:

```bash
node scripts/generate-zoho-token.js YOUR_GRANT_TOKEN_HERE
```

### Step 5: Update .env File

Copy the generated refresh token and add it to your `.env` file:

```bash
ZOHO_CRM_REFRESH_TOKEN=your_generated_refresh_token_here
```

## Complete .env Example

```bash
# Zoho CRM Configuration (AU Region)
ZOHO_CRM_CLIENT_ID=1000.XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
ZOHO_CRM_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
ZOHO_CRM_REFRESH_TOKEN=1000.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
ZOHO_CRM_API_DOMAIN=https://www.zohoapis.com.au

# CRM Module Configuration
ZOHO_CRM_MODULE=Occurrence_Management
```

## Troubleshooting

### Error: "invalid_code"
- The grant token has expired (they expire in 10 minutes)
- Generate a new grant token by repeating Step 2

### Error: "unauthorized_client"
- Check that your Client ID and Client Secret are correct
- Verify the redirect URI in Zoho API Console matches: `http://localhost:3001/oauth/callback`

### Error: "access_denied"
- Make sure you have the necessary permissions in Zoho CRM
- Try generating a new Client ID/Secret with proper scopes


## Required Scopes

The script requests the following scopes:
- `ZohoCRM.modules.ALL` - Access to all CRM modules
- `ZohoCRM.settings.ALL` - Access to CRM settings
- `ZohoCRM.users.READ` - Read user information
WorkDrive.files.ALL,ZohoCRM.modules.ALL

## Security Notes

- Never commit `.env` file to version control
- Keep your Client Secret secure
- Refresh tokens don't expire unless revoked
- Regenerate tokens if compromised
