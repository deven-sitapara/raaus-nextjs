#!/usr/bin/env node
/**
 * Generate Zoho Refresh Token for Any Environment
 * 
 * This script helps generate refresh tokens for dev/staging/production
 * 
 * Usage:
 *   # For default (.env)
 *   npm run zoho:token
 * 
 *   # For staging (.env.staging)
 *   node scripts/generate-token-for-env.js staging
 *   node scripts/generate-token-for-env.js staging YOUR_GRANT_TOKEN
 * 
 *   # For production (.env.production)
 *   node scripts/generate-token-for-env.js production
 *   node scripts/generate-token-for-env.js production YOUR_GRANT_TOKEN
 */

const https = require('https');
const querystring = require('querystring');
const fs = require('fs');
const path = require('path');

// Get environment and grant token from command line
const environment = process.argv[2] || 'default'; // default, staging, production
const grantToken = process.argv[3];

// Determine env file path
const envFiles = {
  'default': '.env',
  'staging': '.env.staging',
  'production': '.env.production',
  'prod': '.env.production'
};

const envFile = envFiles[environment.toLowerCase()] || '.env';
const envPath = path.join(process.cwd(), envFile);

console.log(`\n🔧 Environment: ${environment}`);
console.log(`📄 Using config from: ${envFile}\n`);

// Check if env file exists
if (!fs.existsSync(envPath)) {
  console.error(`❌ Error: ${envFile} not found!`);
  console.log(`\n💡 Create ${envFile} with at least:`);
  console.log(`ZOHO_CLIENT_ID=your_client_id`);
  console.log(`ZOHO_CLIENT_SECRET=your_client_secret\n`);
  process.exit(1);
}

// Load environment variables from specific file
const envConfig = {};
const envContent = fs.readFileSync(envPath, 'utf8');
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=:#]+)=(.*)$/);
  if (match) {
    const key = match[1].trim();
    const value = match[2].trim();
    envConfig[key] = value;
  }
});

// Configuration - try both single token and service-specific
const CLIENT_ID = envConfig.ZOHO_CLIENT_ID || envConfig.ZOHO_CRM_CLIENT_ID;
const CLIENT_SECRET = envConfig.ZOHO_CLIENT_SECRET || envConfig.ZOHO_CRM_CLIENT_SECRET;

// Build redirect URI from NEXT_PUBLIC_APP_URL or fall back to localhost
const APP_URL = envConfig.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';
const REDIRECT_URI = envConfig.ZOHO_REDIRECT_URI || `${APP_URL}/oauth/callback`;
const REGION = 'com.au'; // Australia region

// Scopes for both CRM and WorkDrive - Single token approach
const SCOPES = [
  'ZohoCRM.modules.ALL',
  'ZohoCRM.settings.READ',
  'WorkDrive.files.ALL',
  'WorkDrive.workspace.ALL'
].join(',');

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error(`❌ Error: CLIENT_ID and CLIENT_SECRET must be set in ${envFile}`);
  console.log('\n💡 Required variables:');
  console.log('   ZOHO_CLIENT_ID=your_client_id');
  console.log('   ZOHO_CLIENT_SECRET=your_client_secret\n');
  process.exit(1);
}

console.log('✅ Credentials found in', envFile);
console.log(`   Client ID: ${CLIENT_ID.substring(0, 15)}...`);
console.log(`   Redirect URI: ${REDIRECT_URI}\n`);

// Step 1: Print authorization URL
if (!grantToken) {
  const authUrl = `https://accounts.zoho.${REGION}/oauth/v2/auth?` + querystring.stringify({
    scope: SCOPES,
    client_id: CLIENT_ID,
    response_type: 'code',
    access_type: 'offline',
    redirect_uri: REDIRECT_URI
  });

  console.log('═══════════════════════════════════════════════════════════');
  console.log('📋 STEP 1: Get Grant Token');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  console.log('1. Open this URL in your browser:\n');
  console.log('\x1b[36m%s\x1b[0m\n', authUrl); // Cyan color
  
  console.log('2. Login and authorize the application');
  console.log('3. You will be redirected to:');
  console.log(`   ${REDIRECT_URI}?code=GRANT_TOKEN_HERE`);
  console.log('\n4. Copy the entire "code" value from the URL');
  console.log('   (The page will show an error - ignore it!)\n');
  
  console.log('═══════════════════════════════════════════════════════════');
  console.log('📋 STEP 2: Generate Refresh Token');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  console.log('Run this command with your grant token:\n');
  console.log(`\x1b[32m%s\x1b[0m\n`, `node scripts/generate-token-for-env.js ${environment} YOUR_GRANT_TOKEN`); // Green color
  
  console.log('⚠️  IMPORTANT: Grant tokens expire in 10 minutes!\n');
  process.exit(0);
}

// Step 2: Exchange grant token for refresh token
console.log('═══════════════════════════════════════════════════════════');
console.log('🔄 Generating Refresh Token...');
console.log('═══════════════════════════════════════════════════════════\n');

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
    'Content-Type': 'application/x-www-form-urlencoded',
    'Content-Length': Buffer.byteLength(postData)
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
        
        if (response.error === 'invalid_code') {
          console.error('\n💡 The grant token has expired (10 min limit).');
          console.error('   Generate a new one by running:');
          console.error(`   node scripts/generate-token-for-env.js ${environment}\n`);
        } else if (response.error === 'invalid_client') {
          console.error('\n💡 Check your CLIENT_ID and CLIENT_SECRET in', envFile);
        }
        
        console.error('\nFull response:', data, '\n');
        process.exit(1);
      }

      if (response.refresh_token) {
        console.log('✅ SUCCESS! Refresh token generated.\n');
        console.log('═══════════════════════════════════════════════════════════');
        console.log('📋 Add these to your', envFile.toUpperCase());
        console.log('═══════════════════════════════════════════════════════════\n');
        
        console.log('# Single token for both CRM and WorkDrive');
        console.log(`ZOHO_CLIENT_ID=${CLIENT_ID}`);
        console.log(`ZOHO_CLIENT_SECRET=${CLIENT_SECRET}`);
        console.log(`ZOHO_REFRESH_TOKEN=${response.refresh_token}`);
        console.log(`ZOHO_CRM_API_DOMAIN=${response.api_domain || `https://www.zohoapis.${REGION}`}`);
        console.log(`ZOHO_CRM_MODULE=Occurrence_Management`);
        console.log('');
        console.log('# WorkDrive Configuration (using same token)');
        console.log(`ZOHO_WORKDRIVE_PARENT_FOLDER_ID=your_folder_id_here`);
        console.log('');
        
        console.log('═══════════════════════════════════════════════════════════');
        console.log('📊 Token Details:');
        console.log('═══════════════════════════════════════════════════════════');
        console.log('   Access Token:', response.access_token.substring(0, 20) + '...');
        console.log('   Refresh Token:', response.refresh_token.substring(0, 20) + '...');
        console.log('   Expires In:', response.expires_in, 'seconds');
        console.log('   Token Type:', response.token_type);
        console.log('   API Domain:', response.api_domain || `https://www.zohoapis.${REGION}`);
        console.log('═══════════════════════════════════════════════════════════\n');
        
        if (environment === 'staging' || environment === 'production') {
          console.log('📤 Next Steps for Staging/Production:');
          console.log('   1. Copy the environment variables above');
          console.log(`   2. Add them to your ${environment} server's ${envFile}`);
          console.log('   3. Restart your application');
          console.log('   4. Test with: npm run test:integration\n');
        }
        
        console.log('✅ Setup Complete!\n');
      } else {
        console.error('❌ Unexpected response (no refresh_token):', data);
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
  console.error('\n💡 Check your internet connection and try again.\n');
  process.exit(1);
});

req.write(postData);
req.end();

