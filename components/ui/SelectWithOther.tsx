import * as React from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { cn } from "@/lib/utils/cn";

export interface SelectWithOtherProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'name'> {
  label?: string;
  error?: string;
  options: Array<{ value: string; label: string }>;
  name: string;
  customFieldName: string;
  customFieldPlaceholder?: string;
  customFieldValidation?: {
    minLength?: { value: number; message: string };
    maxLength?: { value: number; message: string };
    pattern?: { value: RegExp; message: string };
  };
  onCustomChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  customFieldMaxLength?: number;
  customFieldKeyPress?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

/**
 * SelectWithOther Component
 * 
 * Enhanced select component that automatically handles "Other" option:
 * - Detects when "Other" is selected
 * - Shows custom input field immediately below (no label, lighter border, close spacing)
 * - Manages both select and custom input internally using useWatch
 * - No need to pass watch() from parent component
 * 
 * Usage:
 * <SelectWithOther
 *   name="role"
 *   customFieldName="customRole"
 *   label="Role"
 *   required
 *   options={roleOptions}
 *   customFieldPlaceholder="Enter your role"
 *   customFieldValidation={{
 *     minLength: { value: 2, message: "Must be at least 2 characters" },
 *     pattern: { value: /^[a-zA-Z\s\-.']+$/, message: "Only letters allowed" }
 *   }}
 * />
 */
const SelectWithOther = React.forwardRef<HTMLSelectElement, SelectWithOtherProps>(
  ({ 
    className, 
    label, 
    error, 
    options, 
    required, 
    name,
    customFieldName,
    customFieldPlaceholder = "Please specify...",
    customFieldValidation,
    onCustomChange,
    customFieldMaxLength = 100,
    customFieldKeyPress,
    ...props 
  }, ref) => {
    const { register, formState: { errors } } = useFormContext();
    
    // Watch the select field value internally to show/hide custom input
    const selectedValue = useWatch({ name });
    
    // Check if "Other" is selected
    const showCustomInput = selectedValue === "Other";
    
    // Get error for custom field
    const customError = errors[customFieldName]?.message as string | undefined;

    return (
      <div className="w-full mb-2">
        {/* Select Field */}
        {label && (
          <label className="block text-base font-medium text-black mb-2">
            {label}
            {required && <span className="text-red-600 ml-1">*</span>}
          </label>
        )}
        <select
          className={cn(
            "flex h-10 w-full rounded-md border bg-white px-3 py-2 text-sm",
            "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
            "disabled:cursor-not-allowed disabled:opacity-50 transition-colors",
            error && "border-red-500 focus:ring-red-500",
            // Lighter border for select when "Other" is selected
            showCustomInput ? "border-gray-200" : "border-gray-300",
            className
          )}
          {...register(name, {
            required: required ? `${label || 'This field'} is required` : false,
          })}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}

        {/* Custom Input - Shows when "Other" is selected - NO LABEL, close spacing, lighter border */}
        {showCustomInput && (
          <input
            type="text"
            placeholder={customFieldPlaceholder}
            maxLength={customFieldMaxLength}
            onKeyPress={customFieldKeyPress}
            className={cn(
              "flex h-10 w-full rounded-md border bg-white px-3 py-2 text-sm mt-2",
              "focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent",
              "disabled:cursor-not-allowed disabled:opacity-50 transition-all",
              "placeholder:text-gray-400 border-gray-200",
              customError && "border-red-500 focus:ring-red-500"
            )}
            {...register(customFieldName, {
              ...(customFieldValidation?.minLength && {
                minLength: customFieldValidation.minLength
              }),
              ...(customFieldValidation?.maxLength && {
                maxLength: customFieldValidation.maxLength
              }),
              ...(customFieldValidation?.pattern && {
                pattern: customFieldValidation.pattern
              }),
              onChange: onCustomChange,
            })}
          />
        )}
        {customError && showCustomInput && <p className="mt-1 text-sm text-red-600">{customError}</p>}
      </div>
    );
  }
);
SelectWithOther.displayName = "SelectWithOther";

export { SelectWithOther };
