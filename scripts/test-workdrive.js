/**
 * Test Zoho WorkDrive File Upload
 *
 * This script tests file upload to Zoho WorkDrive
 * by making a POST request with a test file.
 *
 * Usage:
 *   1. Make sure your Next.js server is running (npm run dev)
 *   2. Run: npm run test:workdrive
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { Readable } = require('stream');

// Create a test file content
const testFileContent = 'This is a test file for Zoho WorkDrive upload.\nCreated by automated test script.\nTimestamp: ' + new Date().toISOString();

console.log('\n🧪 Testing WorkDrive File Upload...\n');

// Create boundary for multipart/form-data
const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substr(2);

// Build multipart form data
const formData = [];

// Add file field
formData.push(`--${boundary}\r\n`);
formData.push(`Content-Disposition: form-data; name="files"; filename="test-upload.txt"\r\n`);
formData.push(`Content-Type: text/plain\r\n\r\n`);
formData.push(testFileContent);
formData.push(`\r\n`);

// End boundary
formData.push(`--${boundary}--\r\n`);

const body = formData.join('');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/zoho-workdrive',
  method: 'POST',
  headers: {
    'Content-Type': `multipart/form-data; boundary=${boundary}`,
    'Content-Length': Buffer.byteLength(body)
  }
};

console.log('📋 Test File Details:');
console.log('- Filename: test-upload.txt');
console.log('- Size:', Buffer.byteLength(testFileContent), 'bytes');
console.log('- Content:', testFileContent.substring(0, 50) + '...');
console.log('\n📡 Sending request to http://localhost:3000/api/zoho-workdrive\n');

const req = http.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log(`📊 Response Status: ${res.statusCode}\n`);

    try {
      const response = JSON.parse(data);

      if (res.statusCode === 200 && response.success) {
        console.log('✅ SUCCESS! File uploaded to Zoho WorkDrive\n');
        console.log('📄 Response:');
        console.log(JSON.stringify(response, null, 2));

        if (response.fileIds && response.fileIds.length > 0) {
          console.log('\n✅ Upload Details:');
          console.log(`   - File IDs: ${response.fileIds.join(', ')}`);
        }

        if (response.links && response.links.length > 0) {
          console.log(`   - Shareable Links:`);
          response.links.forEach((link, index) => {
            console.log(`     ${index + 1}. ${link}`);
          });
        }

        console.log('\n🎉 Test completed successfully!\n');
        console.log('💡 You can verify the file in Zoho WorkDrive:');
        console.log('   https://workdrive.zoho.com.au\n');
      } else {
        console.error('❌ FAILED! WorkDrive upload error\n');
        console.error('Error Response:');
        console.error(JSON.stringify(response, null, 2));
        console.log('\n');
      }
    } catch (error) {
      console.error('❌ Failed to parse response:', error.message);
      console.error('Raw response:', data);
      console.log('\n');
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request failed:', error.message);
  console.log('\n💡 Make sure your Next.js dev server is running:');
  console.log('   npm run dev\n');
  console.log('💡 Check that WorkDrive credentials are set in .env:');
  console.log('   ZOHO_WORKDRIVE_CLIENT_ID');
  console.log('   ZOHO_WORKDRIVE_CLIENT_SECRET');
  console.log('   ZOHO_WORKDRIVE_REFRESH_TOKEN');
  console.log('   ZOHO_WORKDRIVE_FOLDER_ID\n');
});

req.write(body);
req.end();
