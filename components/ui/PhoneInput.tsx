"use client";

import * as React from "react";
import { cn } from "@/lib/utils/cn";
import { validatePhoneNumber, getPhoneValidationMessage } from "@/lib/validations/patterns";

export interface PhoneInputProps {
  label?: string;
  error?: string;
  required?: boolean;
  value?: string;
  onChange?: (value: string) => void;
  onValueChange?: (value: string) => void;
  onValidationChange?: (isValid: boolean, errorMessage: string) => void;
  onCountryChange?: (country: "AU" | "CA" | "GB" | "US") => void;
  defaultCountry?: "AU" | "CA" | "GB" | "US";
  countries?: Array<"AU" | "CA" | "GB" | "US">;
  placeholder?: string;
  className?: string;
  validateOnBlur?: boolean;
}

const countryData = {
  AU: { name: "Australia", code: "+61", flag: "🇦🇺" },
  CA: { name: "Canada", code: "+1", flag: "🇨🇦" },
  GB: { name: "United Kingdom", code: "+44", flag: "🇬🇧" },
  US: { name: "United States", code: "+1", flag: "🇺🇸" },
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
      validateOnBlur = true,
      ...props
    },
    ref
  ) => {
    const [selectedCountry, setSelectedCountry] = React.useState<keyof typeof countryData>(defaultCountry);
    const [isOpen, setIsOpen] = React.useState(false);
    const [internalError, setInternalError] = React.useState<string>("");
    const [touched, setTouched] = React.useState(false);
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

    const handleCountryChange = (country: keyof typeof countryData) => {
      setSelectedCountry(country);
      setIsOpen(false);
      onCountryChange?.(country);
      
      // Re-validate with new country if field is touched and has value
      if (touched && value) {
        validatePhone(value, country);
      }
    };

    const validatePhone = (phoneValue: string, country: keyof typeof countryData) => {
      if (!phoneValue || phoneValue.trim() === "") {
        if (required) {
          const errorMsg = "Phone number is required";
          setInternalError(errorMsg);
          onValidationChange?.(false, errorMsg);
          return false;
        }
        setInternalError("");
        onValidationChange?.(true, "");
        return true;
      }

      const isValid = validatePhoneNumber(phoneValue, country);
      if (!isValid) {
        const errorMsg = getPhoneValidationMessage(country);
        setInternalError(errorMsg);
        onValidationChange?.(false, errorMsg);
        return false;
      }

      setInternalError("");
      onValidationChange?.(true, "");
      return true;
    };

    const handleBlur = () => {
      setTouched(true);
      if (validateOnBlur) {
        validatePhone(value, selectedCountry);
      }
    };

    const handleChange = (newValue: string) => {
      onChange?.(newValue);
      onValueChange?.(newValue);
      
      // Clear error when user starts typing
      if (touched && internalError) {
        setInternalError("");
      }
    };

    // Use external error if provided, otherwise use internal error
    const displayError = error || internalError;

    return (
      <div className="w-full" style={{marginBottom: '10px'}}>
        {label && (
          <label className="block text-base font-medium text-black mb-1" style={{fontSize: '16px', color: '#000000', marginBottom: '10px'}}>
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
              onChange={(e) => handleChange(e.target.value)}
              onBlur={handleBlur}
              placeholder={placeholder}
              className="flex-1 px-3 py-2 text-sm outline-none bg-white !mb-0"
              {...props}
            />
          </div>

          {/* Dropdown */}
          {isOpen && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
              {countries.map((country) => (
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

        {displayError && <p className="mt-1 text-sm text-red-600">{displayError}</p>}
      </div>
    );
  }
);

PhoneInput.displayName = "PhoneInput";

export { PhoneInput };
