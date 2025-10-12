"use client";

import * as React from "react";
import { cn } from "@/lib/utils/cn";

type CountryCode = "AU" | "CA" | "GB" | "US";

export interface PhoneInputProps {
  label?: string;
  error?: string;
  required?: boolean;
  value?: string;
  onChange?: (value: string) => void;
  onValueChange?: (value: string) => void;
  onValidationChange?: (isValid: boolean, errorMessage: string) => void;
  onCountryChange?: (country: CountryCode) => void;
  defaultCountry?: CountryCode;
  countries?: Array<CountryCode>;
  placeholder?: string;
  className?: string;
  showValidationCriteria?: boolean;
}

const countryData: Record<CountryCode, { name: string; code: string; flag: string; minLength: number; maxLength: number; format: string; startsWithZero: boolean }> = {
  AU: { name: "Australia", code: "+61", flag: "🇦🇺", minLength: 10, maxLength: 10, format: "04XX XXX XXX", startsWithZero: true },
  CA: { name: "Canada", code: "+1", flag: "🇨🇦", minLength: 10, maxLength: 10, format: "XXX XXX XXXX", startsWithZero: false },
  GB: { name: "United Kingdom", code: "+44", flag: "🇬🇧", minLength: 11, maxLength: 11, format: "0XXXX XXXXXX", startsWithZero: true },
  US: { name: "United States", code: "+1", flag: "🇺🇸", minLength: 10, maxLength: 10, format: "XXX XXX XXXX", startsWithZero: false },
};

const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(
  (
    {
      label,
      error,
      required,
      value = "",
      onChange,
      onValueChange,
      onValidationChange,
      onCountryChange,
      defaultCountry = "AU",
      countries = ["AU", "CA", "GB", "US"],
      placeholder = "0412 345 678",
      className,
      showValidationCriteria = true,
      ...props
    },
    ref
  ) => {
    const [selectedCountry, setSelectedCountry] = React.useState<CountryCode>(defaultCountry);
    const [isOpen, setIsOpen] = React.useState(false);
    const [internalError, setInternalError] = React.useState<string>("");
    const [focused, setFocused] = React.useState(false);
    const dropdownRef = React.useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    React.useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
          setIsOpen(false);
        }
      };

      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Get validation criteria for current input
    const getValidationCriteria = (phoneValue: string, country: CountryCode) => {
      const cleanNumber = phoneValue.replace(/[\s\-\(\)\.\+]/g, '');
      const countryInfo = countryData[country];
      const isEmpty = !phoneValue || phoneValue.trim() === "" || cleanNumber.length === 0;
      
      // For Australian numbers, check if it follows 04XX pattern (starts with 04)
      const followsFormat = isEmpty ? false : (
        country === 'AU' 
          ? cleanNumber.startsWith('04')
          : country === 'GB'
          ? cleanNumber.startsWith('0')
          : !cleanNumber.startsWith('0')
      );
      
      return {
        startsCorrectly: isEmpty ? false : (
          countryInfo.startsWithZero 
            ? cleanNumber.startsWith('0')
            : !cleanNumber.startsWith('0')
        ),
        followsFormat: followsFormat,
        correctLength: isEmpty ? false : (cleanNumber.length >= countryInfo.minLength && cleanNumber.length <= countryInfo.maxLength),
        notEmpty: phoneValue && phoneValue.trim() !== ""
      };
    };

    const validatePhone = (phoneValue: string, country: CountryCode) => {
      if (!phoneValue || phoneValue.trim() === "") {
        const errorMsg = required ? "Phone number is required" : "";
        setInternalError(errorMsg);
        onValidationChange?.(false, errorMsg);
        return false;
      }

      const cleanNumber = phoneValue.replace(/[\s\-\(\)\.\+]/g, '');
      const countryInfo = countryData[country];
      
      // Check for letters
      if (/[a-zA-Z]/.test(phoneValue)) {
        const errorMsg = "Phone number cannot contain letters";
        setInternalError(errorMsg);
        onValidationChange?.(false, errorMsg);
        return false;
      }
      
      // Check if starts correctly
      if (countryInfo.startsWithZero && !cleanNumber.startsWith('0')) {
        const errorMsg = `${countryInfo.name} phone numbers must start with 0`;
        setInternalError(errorMsg);
        onValidationChange?.(false, errorMsg);
        return false;
      }
      
      if (!countryInfo.startsWithZero && cleanNumber.startsWith('0')) {
        const errorMsg = `${countryInfo.name} phone numbers should not start with 0`;
        setInternalError(errorMsg);
        onValidationChange?.(false, errorMsg);
        return false;
      }
      
      // Check for specific format (e.g., Australian mobile must start with 04)
      if (country === 'AU' && !cleanNumber.startsWith('04')) {
        const errorMsg = "Australian mobile numbers must start with 04";
        setInternalError(errorMsg);
        onValidationChange?.(false, errorMsg);
        return false;
      }
      
      // Check length
      if (cleanNumber.length < countryInfo.minLength) {
        const errorMsg = `Phone number too short. Need ${countryInfo.minLength === countryInfo.maxLength ? countryInfo.minLength : `${countryInfo.minLength}-${countryInfo.maxLength}`} digits`;
        setInternalError(errorMsg);
        onValidationChange?.(false, errorMsg);
        return false;
      }
      
      if (cleanNumber.length > countryInfo.maxLength) {
        const errorMsg = `Phone number too long. Need ${countryInfo.minLength === countryInfo.maxLength ? countryInfo.minLength : `${countryInfo.minLength}-${countryInfo.maxLength}`} digits`;
        setInternalError(errorMsg);
        onValidationChange?.(false, errorMsg);
        return false;
      }
      
      // Valid
      setInternalError("");
      onValidationChange?.(true, "");
      return true;
    };

    const handleCountryChange = (country: CountryCode) => {
      setSelectedCountry(country);
      setIsOpen(false);
      onCountryChange?.(country);
      
      // Re-validate with new country
      if (value) {
        validatePhone(value, country);
      }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let newValue = e.target.value;
      
      // Block letters immediately
      if (/[a-zA-Z]/.test(newValue)) {
        setInternalError("Letters are not allowed in phone numbers");
        return;
      }
      
      // Clear letter error if input is now valid
      if (internalError === "Letters are not allowed in phone numbers") {
        setInternalError("");
      }
      
      onChange?.(newValue);
      onValueChange?.(newValue);
      
      // Validate on change
      if (newValue) {
        validatePhone(newValue, selectedCountry);
      }
    };

    const handleBlur = () => {
      setFocused(false);
      if (value) {
        validatePhone(value, selectedCountry);
      }
    };

    const handleFocus = () => {
      setFocused(true);
    };

    // Get current validation criteria
    const validationCriteria = getValidationCriteria(value, selectedCountry);
    const displayError = error || internalError;

    return (
      <div className="w-full mb-2">
        {label && (
          <label className="block text-base font-medium text-black mb-2">
            {label}
            {required && <span className="text-red-600 ml-1">*</span>}
          </label>
        )}

        <div className="relative" ref={dropdownRef}>
          <div
            className={cn(
              "flex items-center w-full rounded-md border border-gray-300 bg-white overflow-hidden",
              "focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent",
              displayError && "border-red-500 focus-within:ring-red-500",
              className
            )}
          >
            {/* Country Selector */}
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className="flex items-center gap-2 px-3 py-2 border-r border-gray-300 bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <span className="text-lg">{countryData[selectedCountry].flag}</span>
              <span className="text-sm text-gray-600">{countryData[selectedCountry].code}</span>
              <svg
                className={cn(
                  "w-4 h-4 text-gray-400 transition-transform",
                  isOpen && "rotate-180"
                )}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Phone Input */}
            <input
              ref={ref}
              type="tel"
              value={value}
              onChange={handleChange}
              onBlur={handleBlur}
              onFocus={handleFocus}
              placeholder={placeholder}
              className="flex-1 px-3 py-2 text-sm outline-none bg-white !mb-0"
              autoComplete="tel"
              inputMode="numeric"
              {...props}
            />
          </div>

          {/* Dropdown */}
          {isOpen && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
              {countries
                .sort((a, b) => countryData[a].name.localeCompare(countryData[b].name))
                .map((country) => (
                <button
                  key={country}
                  type="button"
                  onClick={() => handleCountryChange(country)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-100 transition-colors",
                    selectedCountry === country && "bg-blue-50"
                  )}
                >
                  <span className="text-lg">{countryData[country].flag}</span>
                  <span className="flex-1 text-sm text-gray-700">{countryData[country].name}</span>
                  <span className="text-sm text-gray-500">{countryData[country].code}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Show error message when validation criteria is not shown */}
        {!showValidationCriteria && displayError && (
          <p className="mt-1 text-sm text-red-600">{displayError}</p>
        )}
        
        {/* Show error message when not focused but has error */}
        {showValidationCriteria && !focused && displayError && (
          <p className="mt-1 text-sm text-red-600">{displayError}</p>
        )}
        
        {/* Show 4 validation criteria when enabled */}
        {showValidationCriteria && focused && (
          <div className="mt-2 p-3">
            <p className="text-sm font-medium text-gray-700 mb-3">
              Phone number requirements for {countryData[selectedCountry].name}:
            </p>
            <div className="space-y-2">
              <div className={`flex items-center text-sm ${
                validationCriteria.startsCorrectly ? "text-green-600" : "text-red-500"
              }`}>
                <span className="mr-3 text-base">{validationCriteria.startsCorrectly ? "✓" : "✗"}</span>
                <span>
                  {countryData[selectedCountry].startsWithZero 
                    ? "Must start with 0" 
                    : "Must NOT start with 0"
                  }
                </span>
              </div>
              
              <div className={`flex items-center text-sm ${
                validationCriteria.followsFormat ? "text-green-600" : "text-red-500"
              }`}>
                <span className="mr-3 text-base">{validationCriteria.followsFormat ? "✓" : "✗"}</span>
                <span>Must follow the format: {countryData[selectedCountry].format}</span>
              </div>
              
              <div className={`flex items-center text-sm ${
                validationCriteria.correctLength ? "text-green-600" : "text-red-500"
              }`}>
                <span className="mr-3 text-base">{validationCriteria.correctLength ? "✓" : "✗"}</span>
                <span>
                  Must be {countryData[selectedCountry].minLength === countryData[selectedCountry].maxLength 
                    ? `exactly ${countryData[selectedCountry].minLength} digits`
                    : `between ${countryData[selectedCountry].minLength} and ${countryData[selectedCountry].maxLength} digits`
                  } long
                </span>
              </div>
              
              <div className={`flex items-center text-sm ${
                validationCriteria.notEmpty ? "text-green-600" : "text-red-500"
              }`}>
                <span className="mr-3 text-base">{validationCriteria.notEmpty ? "✓" : "✗"}</span>
                <span>Field must not be empty{required ? " (required)" : ""}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
);

PhoneInput.displayName = "PhoneInput";

export { PhoneInput };
