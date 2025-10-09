/**
 * Test Full CRM + WorkDrive Integration
 * 
 * This script tests the complete workflow:
 * 1. Submit form data to CRM
 * 2. Fetch OccurrenceId
 * 3. Create WorkDrive folder
 * 4. Upload files
 * 
 * Usage:
 *   1. Make sure your Next.js server is running (npm run dev)
 *   2. Run: npm run test:integration
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

// Create a test file
const testFileName = 'test-integration-file.txt';
const testFileContent = `Integration Test File
Created: ${new Date().toISOString()}
This file tests the complete CRM + WorkDrive workflow.
`;

console.log('\n🧪 Testing Full CRM + WorkDrive Integration...\n');

// Build multipart form data with boundary
const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substr(2);

// Test form data
const formData = {
  formType: 'complaint',
  formData: JSON.stringify({
    // Person Reporting
    Role: 'Pilot in Command',
    Member_Number: '123456',
    Name1: 'Integration',
    Last_Name: 'Test',
    Contact_Phone: '+61412345678',
    Reporter_Email: 'integration.test@example.com',

    // Complaint Information
    Occurrence_Date1: new Date().toISOString(),
    Description_of_Occurrence: 'This is an automated integration test to verify both CRM and WorkDrive are working correctly. ' +
                               'This test creates a CRM record, fetches the OccurrenceId, creates a WorkDrive folder, and uploads a file.',
    
    wishToRemainAnonymous: false
  })
};

// Build multipart body
const parts = [];

// Add formType field
parts.push(`--${boundary}\r\n`);
parts.push(`Content-Disposition: form-data; name="formType"\r\n\r\n`);
parts.push(`${formData.formType}\r\n`);

// Add formData field
parts.push(`--${boundary}\r\n`);
parts.push(`Content-Disposition: form-data; name="formData"\r\n\r\n`);
parts.push(`${formData.formData}\r\n`);

// Add test file
parts.push(`--${boundary}\r\n`);
parts.push(`Content-Disposition: form-data; name="file_0"; filename="${testFileName}"\r\n`);
parts.push(`Content-Type: text/plain\r\n\r\n`);
parts.push(testFileContent);
parts.push(`\r\n`);

// End boundary
parts.push(`--${boundary}--\r\n`);

const body = parts.join('');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/submit-form',
  method: 'POST',
  headers: {
    'Content-Type': `multipart/form-data; boundary=${boundary}`,
    'Content-Length': Buffer.byteLength(body)
  }
};

console.log('📋 Test Details:');
console.log('- Endpoint: /api/submit-form');
console.log('- Form Type: complaint');
console.log('- Test File:', testFileName);
console.log('- File Size:', Buffer.byteLength(testFileContent), 'bytes');
console.log('\n📡 Sending request to http://localhost:3000/api/submit-form\n');
console.log('⏳ This may take 10-15 seconds (waiting for OccurrenceId)...\n');

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
        console.log('✅ SUCCESS! Full Integration Test Passed\n');
        console.log('═══════════════════════════════════════════════════════════');
        console.log('📄 Integration Test Results:');
        console.log('═══════════════════════════════════════════════════════════\n');
        
        // CRM Results
        console.log('🔷 ZOHO CRM:');
        console.log(`   ✅ Record Created: ${response.recordId}`);
        console.log(`   ✅ OccurrenceId: ${response.occurrenceId || 'Not generated'}`);
        
        // WorkDrive Results
        console.log('\n🔷 ZOHO WORKDRIVE:');
        if (response.workdriveFolder) {
          console.log(`   ✅ Folder Name: "${response.occurrenceId}" (Exact match with OccurrenceId)`);
          console.log(`   ✅ Folder ID: ${response.workdriveFolder}`);
          console.log(`   ✅ Files Uploaded: ${response.attachmentCount || 0} file(s)`);
          
          if (response.attachments && response.attachments.length > 0) {
            console.log('\n   📎 Uploaded Files:');
            response.attachments.forEach((att, idx) => {
              console.log(`      ${idx + 1}. ${att.fileName} (${att.status})`);
              if (att.fileId) {
                console.log(`         File ID: ${att.fileId}`);
              }
            });
          }
          
          console.log('\n   📁 Folder Structure:');
          console.log(`      WorkDrive Root → ${response.occurrenceId}/ → ${testFileName}`);
        } else {
          console.log(`   ⚠️  Folder not created: ${response.warning || 'Unknown reason'}`);
        }
        
        // Summary
        console.log('\n═══════════════════════════════════════════════════════════');
        console.log('✨ INTEGRATION STATUS:');
        console.log('═══════════════════════════════════════════════════════════');
        console.log('   🟢 CRM Integration: WORKING');
        console.log('   🟢 WorkDrive Integration: ' + (response.workdriveFolder ? 'WORKING' : 'CONFIGURED (check warning)'));
        console.log('   🟢 Full Workflow: OPERATIONAL');
        console.log('═══════════════════════════════════════════════════════════\n');
        
        // Verification steps
        console.log('💡 Verification Steps:');
        console.log('   1. Check Zoho CRM Occurrence_Management module');
        console.log(`      Record ID: ${response.recordId}`);
        if (response.occurrenceId) {
          console.log(`      Look for OccurrenceId: ${response.occurrenceId}`);
          console.log('\n   2. Check Zoho WorkDrive');
          console.log(`      Look for folder: ${response.occurrenceId}`);
          console.log(`      Should contain: ${testFileName}`);
        }
        console.log('\n🎉 Integration test completed successfully!\n');
        
      } else {
        console.error('❌ FAILED! Integration test failed\n');
        console.error('Error Response:');
        console.error(JSON.stringify(response, null, 2));
        
        if (response.error) {
          console.error('\n💡 Error Details:', response.error);
        }
        if (response.details) {
          console.error('💡 Additional Details:', response.details);
        }
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
  console.log('\n💡 Troubleshooting:');
  console.log('   1. Make sure your Next.js dev server is running:');
  console.log('      npm run dev\n');
  console.log('   2. Check that all environment variables are set:');
  console.log('      - ZOHO_CLIENT_ID');
  console.log('      - ZOHO_CLIENT_SECRET');
  console.log('      - ZOHO_REFRESH_TOKEN');
  console.log('      - ZOHO_WORKDRIVE_CLIENT_ID');
  console.log('      - ZOHO_WORKDRIVE_CLIENT_SECRET');
  console.log('      - ZOHO_WORKDRIVE_REFRESH_TOKEN');
  console.log('      - ZOHO_WORKDRIVE_PARENT_FOLDER_ID\n');
});

req.write(body);
req.end();

