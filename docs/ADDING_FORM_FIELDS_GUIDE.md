# Guide: Adding New Fields to Forms

This guide explains how to properly add new fields to forms ensuring they work with auto-save, preview, and submission.

## Overview

When adding a new field to any form (Accident, Defect, Hazard, Complaint), you need to update **4 key areas**:

1. **Form Component** - Add the input field
2. **State Management** - Add state variables if needed
3. **Auto-Save Integration** - Include in persistence hooks
4. **Preview Component** - Display in preview screen
5. **Submission Data** - Include in API payload

---

## Step-by-Step Process

### 1. Add Field to Form Component

**Location**: `app/{form-type}/page.tsx`

```tsx
// Example: Adding a text input
<Input
  label="Field Label"
  type="text"
  required
  {...register("fieldName", { required: "Field is required" })}
  error={errors.fieldName?.message}
/>

// Example: Adding state-controlled field
<Input
  label="Field Label"
  type="text"
  value={fieldValue}
  onChange={(e) => setFieldValue(e.target.value)}
/>
```

### 2. Add State Variables (if not using react-hook-form)

**Location**: `app/{form-type}/page.tsx` - near other `useState` declarations

```tsx
const [fieldValue, setFieldValue] = useState("");
```

### 3. Integrate with Auto-Save

#### For react-hook-form fields:
Auto-save works automatically with `useFormPersistence` hook - no extra code needed!

#### For state-controlled fields:
Add to `useSpecialStatePersistence`:

```tsx
const { clearSpecialState } = useSpecialStatePersistence(
  'formType',
  stepNumber,
  {
    existingField1,
    existingField2,
    fieldValue,  // Add your new field here
  },
  {
    existingField1: setExistingField1,
    existingField2: setExistingField2,
    fieldValue: setFieldValue,  // Add setter here
  }
);
```

### 4. Add to Preview Component

**Location**: `components/forms/{FormType}Preview.tsx`

**A. Update Props Interface:**
```tsx
interface PreviewProps {
  data: FormData;
  // ... other props
  fieldValue?: string;  // Add new field
}
```

**B. Display in Preview:**
```tsx
{fieldValue && (
  <div className="grid grid-cols-3 gap-4 py-3 border-b">
    <div className="font-medium text-gray-700">Field Label:</div>
    <div className="col-span-2">{fieldValue}</div>
  </div>
)}
```

**C. Pass from Parent:**
```tsx
<FormPreview
  data={previewData}
  // ... other props
  fieldValue={fieldValue}
/>
```

### 5. Include in Submission Data

**Location**: `app/{form-type}/page.tsx` - in `onSubmit` function

```tsx
const submissionData = {
  // ... existing fields
  Field_Name_In_Zoho: data.fieldName || fieldValue,
  // Note: Use field names that match Zoho CRM API field names
};
```

### 6. Clear on Form Reset

Add to clear functions:

```tsx
const handleClearForm = () => {
  reset();
  clearCurrentForm();
  clearSpecialState();  // If using special state
  setFieldValue("");     // Clear state-controlled fields
};
```

---

## Special Case: GPS Coordinates

For location fields with GPS coordinates:

### Implementation:
```tsx
// 1. State variables
const [latitude, setLatitude] = useState("");
const [longitude, setLongitude] = useState("");

// 2. Location textarea (existing field)
<Textarea
  label="Location"
  {...register("location", { required: true })}
/>

// 3. MapPicker component (appends to location)
<MapPicker
  latitude={latitude}
  longitude={longitude}
  onLocationSelect={(lat, lng) => {
    setLatitude(lat);
    setLongitude(lng);
    // Append to existing location field
    const currentLocation = watch("location") || "";
    const coordsText = `\nGPS: ${lat}, ${lng}`;
    const cleanLocation = currentLocation.replace(/\nGPS:.*[\s\S]*$/g, '');
    setValue("location", cleanLocation + coordsText);
  }}
  label="Pinpoint Location on Map (Optional)"
/>

// 4. Auto-save integration
useSpecialStatePersistence(
  'formType',
  step,
  { latitude, longitude },
  { latitude: setLatitude, longitude: setLongitude }
);

// 5. Submission (coordinates embedded in location field)
// No separate fields needed - already in location text!
```

---

## Checklist

When adding a new field, verify:

- [ ] Field appears in form
- [ ] Validation works (if required)
- [ ] Auto-save persists data on page reload
- [ ] Field appears in preview screen
- [ ] Data submits to Zoho CRM correctly
- [ ] Field clears when "Clear Form" is clicked
- [ ] Field clears after successful submission

---

## Common Pitfalls

1. **Forgot Auto-Save**: State-controlled fields won't persist without `useSpecialStatePersistence`
2. **Forgot Preview**: Users won't see the field before submitting
3. **Wrong Zoho Field Name**: Check Zoho CRM API docs for correct field names
4. **Forgot to Clear**: Fields remain filled after form clear/submit
5. **Validation Not Working**: Missing `required` in register() or validation rules

---

## Examples by Form Type

### Hazard Form
- **Location Field**: `Location_of_Hazard` (textarea with GPS coordinates appended)
- **Aerodrome Field**: `selectedAerodrome` (state) → `Hazard_Aerodrome` (submission)
- **GPS**: `latitude`, `longitude` (state) → appended to `Location_of_Hazard`

### Accident Form  
- **Location Field**: `location` (textarea with GPS coordinates appended)
- **GPS**: `latitude`, `longitude` (state) → appended to `location`

### Defect Form
- **Location Field**: `locationOfAircraft` (textarea with GPS coordinates appended)
- **GPS**: `latitude`, `longitude` (state) → appended to `locationOfAircraft`

---

## Testing Your Changes

1. Fill out the field
2. Refresh page → Verify data persists
3. Navigate to preview → Verify field displays
4. Submit form → Check console/network tab
5. Check Zoho CRM → Verify data received
6. Click "Clear Form" → Verify field clears
7. Submit again → Verify previous data cleared

---

## Need Help?

- Check existing fields in the same form for reference
- Look at similar fields in other forms
- Review `useFormPersistence` and `useSpecialStatePersistence` hooks
- Check Zoho CRM API field mappings in `docs/api_field_mapping.md`
