# Form Persistence System

Auto-saves form data to session storage. Data survives page reloads.

## Features
- ✅ Auto-saves all form fields (zero config for new fields)
- ✅ Step-by-step persistence for multi-step forms
- ✅ Clear buttons (current step or entire form)
- ✅ Auto-cleanup on successful submission

## Main Functions (`lib/utils/formPersistence.ts`)

```typescript
useFormPersistence(config, watch, setValue, reset)     // Handles all form fields
useSpecialStatePersistence(type, step, state, setters) // Handles dates/phones/etc
clearFormOnSubmission(formType, maxSteps?)             // Cleanup after submit
```

## Usage

**Single-step form:**
```typescript
const { clearCurrentForm } = useFormPersistence({ formType: 'hazard' }, watch, setValue, reset);
const { clearSpecialState } = useSpecialStatePersistence('hazard', undefined, {date}, {date: setDate});

// Clear button: clearCurrentForm() + clearSpecialState()
// On submit: clearFormOnSubmission('hazard')
```

**Multi-step form:**
```typescript
const { clearCurrentForm } = useFormPersistence({ formType: 'accident', stepIndex: currentStep, maxSteps: 3 }, watch, setValue, reset);
const { clearSpecialState } = useSpecialStatePersistence('accident', currentStep, {date}, {date: setDate});

// Clear button: clearCurrentForm() + clearSpecialState() (current step only)
// On submit: clearFormOnSubmission('accident', 3)
```

## Adding New Fields

**Form fields:** Just add `<Input {...register("newField")} />` - persistence is automatic!

**Special state:** Add to state object and setters in `useSpecialStatePersistence()`

## Migration

1. Import: `useFormPersistence, useSpecialStatePersistence, clearFormOnSubmission`
2. Add `reset` to `useForm()`
3. Replace old persistence with new hooks
4. Update clear buttons and submission cleanup

## Overview

This project implements an intelligent form persistence system that automatically saves user input to browser session storage and restores it when users return to forms. The system is designed to be developer-friendly, requiring minimal code changes when adding new form fields.

## Key Features

- ✅ **Automatic form field detection and persistence**
- ✅ **Session storage for data that survives page reloads**
- ✅ **Step-specific persistence for multi-step forms**
- ✅ **Clear form functionality for individual steps or entire forms**
- ✅ **Automatic cleanup on successful form submission**
- ✅ **Special state handling for non-form fields (dates, phone numbers, etc.)**

## How It Works

### 1. Core Persistence Hooks

The system provides two main hooks in `lib/utils/formPersistence.ts`:

#### `useFormPersistence`
Automatically handles all form fields registered with react-hook-form:

```typescript
const { clearCurrentForm } = useFormPersistence(
  { formType: 'hazard' },           // Configuration
  watch,                            // react-hook-form watch function
  setValue,                         // react-hook-form setValue function
  reset                            // react-hook-form reset function
);
```

#### `useSpecialStatePersistence`
Handles non-form state variables like dates, phone numbers, and custom state:

```typescript
const { clearSpecialState } = useSpecialStatePersistence(
  'hazard',                         // Form type
  undefined,                        // Step index (undefined for single-step forms)
  { hazardDate, hazardTime },       // State object to persist
  {                                 // Setter functions
    hazardDate: setHazardDate,
    hazardTime: setHazardTime
  }
);
```

### 2. Automatic Field Detection

The system automatically detects form fields using react-hook-form's `watch()` function. When a user types in any field registered with `{...register("fieldName")}`, the data is automatically saved to session storage.

**Example**: Adding a new field requires zero persistence code:
```jsx
// Just add this to your JSX - persistence is automatic!
<Input
  label="New Field"
  {...register("newFieldName")}
  error={errors.newFieldName?.message}
/>
```

### 3. Storage Strategy

Data is stored in browser session storage with structured keys:
- Single forms: `{formType}_form`
- Multi-step forms: `{formType}_step_{stepIndex}`
- Special state: `{formType}_step_{stepIndex}_special`

## Implementation Examples

### Single-Step Form (Hazard Form)

```typescript
export default function HazardForm() {
  const [hazardDate, setHazardDate] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  
  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm();

  // Form persistence - handles ALL form fields automatically
  const { clearCurrentForm } = useFormPersistence(
    { formType: 'hazard' }, 
    watch, 
    setValue, 
    reset
  );

  // Special state persistence - handles non-form state
  const { clearSpecialState } = useSpecialStatePersistence(
    'hazard',
    undefined,
    { hazardDate, contactPhone },
    {
      hazardDate: setHazardDate,
      contactPhone: setContactPhone
    }
  );

  const onSubmit = async (data) => {
    // ... submission logic
    if (success) {
      clearFormOnSubmission('hazard'); // Clear all data on success
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* Clear Form Button */}
      <Button onClick={() => {
        clearCurrentForm();    // Clears all form fields
        clearSpecialState();   // Clears special state
        setAttachments(null);  // Clear any other local state
      }}>
        Clear Form
      </Button>

      {/* Form fields - automatically persisted */}
      <Input {...register("firstName")} />
      <Input {...register("lastName")} />
      <Input {...register("email")} />
      
      {/* Special state fields - manually handled */}
      <input 
        type="date"
        value={hazardDate}
        onChange={(e) => setHazardDate(e.target.value)}
      />
    </form>
  );
}
```

### Multi-Step Form (Accident Form)

```typescript
export default function AccidentForm() {
  const [currentStep, setCurrentStep] = useState(1);
  const [occurrenceDate, setOccurrenceDate] = useState("");
  const [contactPhone, setContactPhone] = useState("");

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm();

  // Form persistence for current step only
  const { clearCurrentForm } = useFormPersistence(
    { formType: 'accident', stepIndex: currentStep, maxSteps: 3 }, 
    watch, 
    setValue, 
    reset
  );

  // Special state persistence for current step
  const { clearSpecialState } = useSpecialStatePersistence(
    'accident',
    currentStep,
    { occurrenceDate, contactPhone },
    {
      occurrenceDate: setOccurrenceDate,
      contactPhone: setContactPhone
    }
  );

  const onSubmit = async (data) => {
    // ... submission logic
    if (success) {
      clearFormOnSubmission('accident', 3); // Clear all 3 steps
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* Clear Current Step Button */}
      <Button onClick={() => {
        clearCurrentForm();    // Clears current step's form fields only
        clearSpecialState();   // Clears current step's special state only
      }}>
        Clear Current Step
      </Button>

      {currentStep === 1 && (
        <div>
          {/* Step 1 fields - stored separately from other steps */}
          <Input {...register("firstName")} />
          <Input {...register("lastName")} />
        </div>
      )}

      {currentStep === 2 && (
        <div>
          {/* Step 2 fields - stored separately from step 1 */}
          <Input {...register("location")} />
          <Textarea {...register("description")} />
          
          <input 
            type="date"
            value={occurrenceDate}
            onChange={(e) => setOccurrenceDate(e.target.value)}
          />
        </div>
      )}

      {currentStep === 3 && (
        <div>
          {/* Step 3 fields - stored separately from steps 1 & 2 */}
          <Input {...register("aircraftMake")} />
          <Input {...register("aircraftModel")} />
        </div>
      )}
    </form>
  );
}
```

## Adding New Fields

### For Form Fields (react-hook-form)
Adding a new form field requires **ZERO** persistence code changes:

1. Add the field to your JSX:
```jsx
<Input
  label="New Amazing Field"
  {...register("newAmazingField")}
  error={errors.newAmazingField?.message}
/>
```

2. Add to TypeScript interface (optional but recommended):
```typescript
interface FormData {
  newAmazingField?: string;
}
```

That's it! The field is now automatically:
- Saved when user types
- Restored when user returns to form
- Cleared when user clicks "Clear Form"
- Cleared when form is successfully submitted

### For Special State Fields
For non-form fields (dates, phone numbers, file uploads), add them to the special state configuration:

```typescript
const { clearSpecialState } = useSpecialStatePersistence(
  'formType',
  stepIndex,
  { 
    existingField,
    newSpecialField  // ← Add your new state variable
  },
  {
    existingField: setExistingField,
    newSpecialField: setNewSpecialField  // ← Add your setter function
  }
);
```

## Benefits

### For Developers
- **Faster Development**: No boilerplate persistence code to write
- **Less Maintenance**: No field arrays to keep in sync
- **Fewer Bugs**: Automatic detection prevents forgotten fields
- **Type Safety**: TypeScript integration catches errors at compile time

### For Users
- **Better UX**: Data persists through page reloads and navigation
- **No Lost Work**: Forms remember user input automatically
- **Clear Controls**: Easy way to reset forms when needed

## Technical Implementation

### Storage Keys
The system uses structured session storage keys:
```
// Single-step forms
hazard_form
defect_form
complaint_form

// Multi-step forms
accident_step_1
accident_step_2
accident_step_3

// Special state
hazard_form_special
accident_step_1_special
accident_step_2_special
```

### Data Flow
1. **Load**: On component mount, saved data is loaded from session storage
2. **Save**: When form values change, data is automatically saved
3. **Clear**: Clear buttons remove data from session storage and reset form
4. **Submit**: Successful submission clears all stored data

### Error Handling
- Storage errors are caught and logged with specific keys for debugging
- Failed storage operations don't break form functionality
- TypeScript interfaces prevent runtime type errors

## Migration Guide

If you have existing forms that need to be updated to use this system:

1. **Update imports**:
```typescript
import { useFormPersistence, useSpecialStatePersistence, clearFormOnSubmission } from "@/lib/utils/formPersistence";
```

2. **Add reset to useForm**:
```typescript
const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm();
```

3. **Replace old persistence logic** with new hooks:
```typescript
// Replace complex manual persistence with:
const { clearCurrentForm } = useFormPersistence(config, watch, setValue, reset);
const { clearSpecialState } = useSpecialStatePersistence(formType, stepIndex, stateObject, setters);
```

4. **Update clear button logic**:
```typescript
onClick={() => {
  clearCurrentForm();
  clearSpecialState();
  // Clear any additional local state
}}
```

5. **Update submission success**:
```typescript
if (success) {
  clearFormOnSubmission('formType', maxSteps); // Add maxSteps for multi-step forms
}
```

The new system is designed to be drop-in compatible and significantly reduces the code required for form persistence while providing better functionality and user experience.