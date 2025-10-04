# API Testing Guide

## Test Complaint Form Submission

This test script validates that your complaint form data is correctly submitted to Zoho CRM.

### Prerequisites

1. ✅ Refresh token configured in `.env`
2. ✅ Next.js dev server running on port 3000

### How to Run Test

**Step 1:** Start your development server (if not already running)
```bash
npm run dev
```

**Step 2:** In a new terminal, run the test
```bash
npm run test:complaint
```

### What the Test Does

1. **Sends test data** to `/api/zoho-crm` endpoint
2. **Uses correct CRM field names**:
   - `Role`
   - `Member_Number`
   - `Name1`
   - `Last_Name`
   - `Contact_Phone`
   - `Reporter_Email`
   - `Occurrence_Date1`
   - `Description_of_Occurrence`

3. **Verifies** the submission to Zoho CRM
4. **Displays** record ID and status

### Expected Success Output

```
🧪 Testing Complaint API Submission...

📋 Test Data:
{
  "module": "Occurrence_Management",
  "data": {
    "Role": "Pilot in Command",
    "Member_Number": "123456",
    "Name1": "John",
    "Last_Name": "Smith",
    ...
  }
}

📡 Sending request to http://localhost:3000/api/zoho-crm

📊 Response Status: 200

✅ SUCCESS! Complaint submitted to Zoho CRM

📄 Response:
{
  "data": [
    {
      "code": "SUCCESS",
      "details": {
        "id": "5725767000001234567"
      },
      "message": "record added",
      "status": "success"
    }
  ]
}

✅ Record Details:
   - Status: success
   - Code: SUCCESS
   - Message: record added
   - Record ID: 5725767000001234567

🎉 Test completed successfully!
```

### Verify in Zoho CRM

After successful test:
1. Go to [Zoho CRM](https://crm.zoho.com.au/)
2. Navigate to **Occurrence Management** module
3. Find the test record with:
   - Name: John Smith
   - Role: Pilot in Command
   - Description: "Test complaint submission..."

### Customize Test Data

Edit `scripts/test-complaint-api.js` to modify test data:

```javascript
const testData = {
  module: 'Occurrence_Management',
  data: {
    Role: 'Your Role',
    Name1: 'Your First Name',
    Last_Name: 'Your Last Name',
    // ... other fields
  }
};
```

### Troubleshooting

| Error | Solution |
|-------|----------|
| Connection refused | Make sure dev server is running (`npm run dev`) |
| Authentication failed | Check refresh token in `.env` |
| Field not found | Verify CRM field names match exactly |
| Module not found | Confirm `Occurrence_Management` module exists in CRM |

### Clean Up Test Records

After testing, you can delete test records from Zoho CRM to keep your data clean.
