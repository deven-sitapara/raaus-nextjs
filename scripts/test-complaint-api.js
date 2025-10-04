/**
 * Test Complaint Form API Submission
 *
 * This script tests the complaint form submission to Zoho CRM
 * by making a POST request to the local API endpoint.
 *
 * Usage:
 *   1. Make sure your Next.js server is running (npm run dev)
 *   2. Run: npm run test:complaint
 */

const http = require('http');

// Test data using exact CRM field names
const testData = {
  module: 'Occurrence_Management',
  data: {
    // Person Reporting
    Name: 'John Smith', // Required combined name field
    Role: 'Pilot in Command',
    Member_Number: '123456',
    Name1: 'John',
    Last_Name: 'Smith',
    Contact_Phone: '+61412345678',
    Reporter_Email: 'john.smith@example.com',

    // Complaint Information
    Occurrence_Date1: '2025-10-04T14:30:00+10:00',
    Description_of_Occurrence: 'Test complaint submission from automated test script. This is a test entry to verify API integration with Zoho CRM.',

    // Additional fields
    wishToRemainAnonymous: false,
    attachmentLinks: ''
  }
};

const postData = JSON.stringify(testData);

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/zoho-crm',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

console.log('\n🧪 Testing Complaint API Submission...\n');
console.log('📋 Test Data:');
console.log(JSON.stringify(testData, null, 2));
console.log('\n📡 Sending request to http://localhost:3000/api/zoho-crm\n');

const req = http.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log(`📊 Response Status: ${res.statusCode}\n`);

    try {
      const response = JSON.parse(data);

      if (res.statusCode === 200) {
        console.log('✅ SUCCESS! Complaint submitted to Zoho CRM\n');
        console.log('📄 Response:');
        console.log(JSON.stringify(response, null, 2));

        if (response.data && response.data[0]) {
          const record = response.data[0];
          console.log('\n✅ Record Details:');
          console.log(`   - Status: ${record.status}`);
          console.log(`   - Code: ${record.code}`);
          console.log(`   - Message: ${record.message}`);
          if (record.details && record.details.id) {
            console.log(`   - Record ID: ${record.details.id}`);
          }
        }

        console.log('\n🎉 Test completed successfully!\n');
      } else {
        console.error('❌ FAILED! API returned an error\n');
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
});

req.write(postData);
req.end();
