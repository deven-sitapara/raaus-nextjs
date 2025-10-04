/**
 * Test Zoho Authentication
 *
 * This script tests if the refresh token can generate a valid access token
 */

const https = require('https');
const querystring = require('querystring');
require('dotenv').config();

const CLIENT_ID = process.env.ZOHO_CRM_CLIENT_ID;
const CLIENT_SECRET = process.env.ZOHO_CRM_CLIENT_SECRET;
const REFRESH_TOKEN = process.env.ZOHO_CRM_REFRESH_TOKEN;

if (!CLIENT_ID || !CLIENT_SECRET || !REFRESH_TOKEN) {
  console.error('❌ Missing credentials in .env file');
  process.exit(1);
}

console.log('\n🔐 Testing Zoho Authentication...\n');
console.log('Client ID:', CLIENT_ID);
console.log('Refresh Token:', REFRESH_TOKEN.substring(0, 20) + '...');
console.log('\n');

const postData = querystring.stringify({
  refresh_token: REFRESH_TOKEN,
  client_id: CLIENT_ID,
  client_secret: CLIENT_SECRET,
  grant_type: 'refresh_token'
});

const options = {
  hostname: 'accounts.zoho.com.au',
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
    console.log(`📊 Response Status: ${res.statusCode}\n`);

    try {
      const response = JSON.parse(data);

      if (res.statusCode === 200 && response.access_token) {
        console.log('✅ SUCCESS! Authentication working correctly\n');
        console.log('Access Token:', response.access_token.substring(0, 30) + '...');
        console.log('Expires In:', response.expires_in, 'seconds');
        console.log('Token Type:', response.token_type);
        console.log('\n✅ Your refresh token is valid!\n');
      } else {
        console.error('❌ FAILED! Authentication error\n');
        console.error('Response:', JSON.stringify(response, null, 2));
        console.log('\n💡 You need to generate a new refresh token:');
        console.log('   npm run zoho:token\n');
      }
    } catch (error) {
      console.error('❌ Failed to parse response:', error.message);
      console.error('Raw response:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request failed:', error.message);
});

req.write(postData);
req.end();
