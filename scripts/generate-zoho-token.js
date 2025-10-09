/**
 * Zoho OAuth Refresh Token Generator
 *
 * This script helps you generate a refresh token for Zoho CRM API access.
 *
 * STEPS TO USE:
 *
 * 1. Update your .env file with new CLIENT_ID and CLIENT_SECRET
 *
 * 2. Generate a Grant Token:
 *    - Visit the authorization URL (printed by this script)
 *    - Authorize the application
 *    - Copy the code from the redirect URL
 *
 * 3. Run this script with the grant token:
 *    node scripts/generate-zoho-token.js YOUR_GRANT_TOKEN
 *
 * 4. Copy the refresh token to your .env file
 */

const https = require('https');
const querystring = require('querystring');
require('dotenv').config();

// Configuration
const CLIENT_ID = process.env.ZOHO_CRM_CLIENT_ID || process.env.ZOHO_CLIENT_ID;
const CLIENT_SECRET = process.env.ZOHO_CRM_CLIENT_SECRET || process.env.ZOHO_CLIENT_SECRET;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';
const REDIRECT_URI = process.env.ZOHO_REDIRECT_URI || `${APP_URL}/oauth/callback`;
const REGION = 'com.au'; // Australia region

// Scopes for Zoho CRM and WorkDrive - Single token for both services
const SCOPES = [
  'ZohoCRM.modules.ALL',
  'WorkDrive.files.ALL',
  'WorkDrive.workspace.ALL'
].join(',');

// Get grant token from command line
const grantToken = process.argv[2];

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('❌ Error: CLIENT_ID and CLIENT_SECRET must be set in .env file');
  process.exit(1);
}

// Step 1: Print authorization URL
if (!grantToken) {
  const authUrl = `https://accounts.zoho.${REGION}/oauth/v2/auth?` + querystring.stringify({
    scope: SCOPES,
    client_id: CLIENT_ID,
    response_type: 'code',
    access_type: 'offline',
    redirect_uri: REDIRECT_URI
  });

  console.log('\n📋 STEP 1: Get Grant Token\n');
  console.log('Visit this URL in your browser:\n');
  console.log(authUrl);
  console.log('\n');
  console.log('After authorization, you will be redirected to:');
  console.log(`${REDIRECT_URI}?code=YOUR_GRANT_TOKEN`);
  console.log('\nCopy the "code" parameter value from the URL.\n');
  console.log('📋 STEP 2: Generate Refresh Token\n');
  console.log('Run this command with your grant token:');
  console.log(`node scripts/generate-zoho-token.js YOUR_GRANT_TOKEN\n`);
  process.exit(0);
}

// Step 2: Exchange grant token for refresh token
console.log('\n🔄 Generating refresh token...\n');

const postData = querystring.stringify({
  grant_type: 'authorization_code',
  client_id: CLIENT_ID,
  client_secret: CLIENT_SECRET,
  redirect_uri: REDIRECT_URI,
  code: grantToken
});

const options = {
  hostname: `accounts.zoho.${REGION}`,
  port: 443,
  path: '/oauth/v2/token',
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded'
  }
};

const req = https.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const response = JSON.parse(data);

      if (response.error) {
        console.error('❌ Error:', response.error);
        console.error('Details:', data);
        process.exit(1);
      }

      if (response.refresh_token) {
        console.log('✅ Success! Your refresh token has been generated.\n');
        console.log('📋 Add this to your .env file:\n');
        console.log(`ZOHO_CRM_REFRESH_TOKEN=${response.refresh_token}\n`);
        console.log('Token Details:');
        console.log('- Access Token:', response.access_token);
        console.log('- Expires In:', response.expires_in, 'seconds');
        console.log('- API Domain:', response.api_domain || `https://www.zohoapis.${REGION}`);
        console.log('- Token Type:', response.token_type);
        console.log('\n✅ Setup Complete!\n');
      } else {
        console.error('❌ Unexpected response:', data);
        process.exit(1);
      }
    } catch (error) {
      console.error('❌ Failed to parse response:', error.message);
      console.error('Response:', data);
      process.exit(1);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request failed:', error.message);
  process.exit(1);
});

req.write(postData);
req.end();
