import { useEffect, useCallback, useRef } from 'react';

// Type definitions for better developer experience
export interface FormPersistenceConfig {
  formType: string;
  stepIndex?: number;
  maxSteps?: number;
}

// Core persistence utilities
const createStorageKey = (formType: string, stepIndex?: number, suffix?: string) => {
  const base = stepIndex !== undefined ? `${formType}_step_${stepIndex}` : `${formType}_form`;
  return suffix ? `${base}_${suffix}` : base;
};

const saveToStorage = (key: string, data: any) => {
  try {
    sessionStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Failed to save to storage [${key}]:`, error);
  }
};

const loadFromStorage = (key: string) => {
  try {
    const saved = sessionStorage.getItem(key);
    return saved ? JSON.parse(saved) : null;
  } catch (error) {
    console.error(`Failed to load from storage [${key}]:`, error);
    return null;
  }
};

const removeFromStorage = (key: string) => {
  try {
    sessionStorage.removeItem(key);
  } catch (error) {
    console.error(`Failed to remove from storage [${key}]:`, error);
  }
};

// Enhanced form persistence hook with auto-detection
export const useFormPersistence = (config: FormPersistenceConfig, watch: any, setValue: any, reset: any) => {
  const { formType, stepIndex, maxSteps } = config;
  const isInitialized = useRef<Record<string, boolean>>({});
  
  // Auto-detect and load saved data
  useEffect(() => {
    const storageKey = createStorageKey(formType, stepIndex);
    
    // Check if THIS specific step has been initialized
    if (isInitialized.current[storageKey]) return;
    
    const savedData = loadFromStorage(storageKey);
    
    if (savedData) {
      // Load form data
      Object.entries(savedData).forEach(([key, value]) => {
        setValue(key, value);
      });
    }
    
    // Mark THIS step as initialized
    isInitialized.current[storageKey] = true;
  }, [formType, stepIndex, setValue]);

  // Auto-save form data when it changes
  const watchedValues = watch();
  
  useEffect(() => {
    const storageKey = createStorageKey(formType, stepIndex);
    
    // Only save if THIS step has been initialized (to avoid saving empty data on mount)
    if (!isInitialized.current[storageKey]) return;
    
    const hasData = Object.values(watchedValues).some(value => 
      value !== '' && value !== null && value !== undefined && value !== false
    );
    
    if (hasData) {
      saveToStorage(storageKey, watchedValues);
    }
  }, [watchedValues, formType, stepIndex]);

  // Clear current form/step
  const clearCurrentForm = useCallback(() => {
    const storageKey = createStorageKey(formType, stepIndex);
    removeFromStorage(storageKey);
    
    // Reset form using react-hook-form's reset
    reset();
    
  }, [formType, stepIndex, reset]);

  // Clear all form data (for multi-step forms)
  const clearAllForms = useCallback(() => {
    if (maxSteps) {
      // Multi-step form - clear all steps
      for (let i = 1; i <= maxSteps; i++) {
        const stepKey = createStorageKey(formType, i);
        const specialKey = createStorageKey(formType, i, 'special');
        removeFromStorage(stepKey);
        removeFromStorage(specialKey);
      }
    } else {
      // Single form
      const mainKey = createStorageKey(formType);
      const specialKey = createStorageKey(formType, undefined, 'special');
      removeFromStorage(mainKey);
      removeFromStorage(specialKey);
    }
    
    reset();
  }, [formType, maxSteps, reset]);

  return {
    clearCurrentForm,
    clearAllForms
  };
};

// Hook for managing special state (non-form fields like dates, phone numbers)
export const useSpecialStatePersistence = (
  formType: string, 
  stepIndex: number | undefined, 
  stateObject: Record<string, any>,
  setters: Record<string, (value: any) => void>
) => {
  const isInitialized = useRef<Record<string, boolean>>({});
  
  // Load special state on mount
  useEffect(() => {
    const specialKey = createStorageKey(formType, stepIndex, 'special');
    
    // Check if THIS specific step has been initialized
    if (isInitialized.current[specialKey]) return;
    
    const savedSpecialState = loadFromStorage(specialKey);
    
    if (savedSpecialState) {
      Object.entries(savedSpecialState).forEach(([key, value]) => {
        if (setters[key]) {
          setters[key](value);
        }
      });
    }
    
    // Mark THIS step as initialized
    isInitialized.current[specialKey] = true;
  }, [formType, stepIndex, setters]);

  // Save special state when it changes
  useEffect(() => {
    const specialKey = createStorageKey(formType, stepIndex, 'special');
    
    // Only save if THIS step has been initialized
    if (!isInitialized.current[specialKey]) return;
    
    const hasData = Object.values(stateObject).some(value => 
      value !== '' && value !== null && value !== undefined
    );
    
    if (hasData) {
      saveToStorage(specialKey, stateObject);
    }
  }, [stateObject, formType, stepIndex]);

  // Clear special state
  const clearSpecialState = useCallback(() => {
    const specialKey = createStorageKey(formType, stepIndex, 'special');
    removeFromStorage(specialKey);
    
    // Reset all state values to their default types
    Object.entries(setters).forEach(([key, setter]) => {
      if (typeof stateObject[key] === 'boolean') {
        setter(false);
      } else if (typeof stateObject[key] === 'string') {
        setter('');
      } else {
        setter(null);
      }
    });
  }, [formType, stepIndex, setters, stateObject]);

  return { clearSpecialState };
};

// Utility function to clear everything on successful submission
export const clearFormOnSubmission = (formType: string, maxSteps?: number) => {
  if (maxSteps) {
    // Multi-step form
    for (let i = 1; i <= maxSteps; i++) {
      const stepKey = createStorageKey(formType, i);
      const specialKey = createStorageKey(formType, i, 'special');
      removeFromStorage(stepKey);
      removeFromStorage(specialKey);
    }
  } else {
    // Single form
    const mainKey = createStorageKey(formType);
    const specialKey = createStorageKey(formType, undefined, 'special');
    removeFromStorage(mainKey);
    removeFromStorage(specialKey);
  }
};