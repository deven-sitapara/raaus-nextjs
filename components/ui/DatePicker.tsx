"use client";

import * as React from "react";
import ReactDatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { cn } from "@/lib/utils/cn";

export interface DatePickerProps {
  label?: string;
  error?: string;
  required?: boolean;
  selected?: Date | null;
  onChange?: (date: Date | null) => void;
  onValueChange?: (date: Date | null) => void;
  showTimeSelect?: boolean;
  dateFormat?: string;
  placeholderText?: string;
  minDate?: Date;
  maxDate?: Date;
  className?: string;
}

const DatePicker = React.forwardRef<ReactDatePicker, DatePickerProps>(
  (
    {
      label,
      error,
      required,
      selected,
      onChange,
      onValueChange,
      showTimeSelect = false,
      dateFormat = "MM/dd/yyyy",
      placeholderText,
      minDate,
      maxDate,
      className,
      ...props
    },
    ref
  ) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label}
            {required && <span className="text-red-600 ml-1">*</span>}
          </label>
        )}
        <ReactDatePicker
          ref={ref}
          selected={selected}
          onChange={(date) => {
            onChange?.(date);
            onValueChange?.(date);
          }}
          showTimeSelect={showTimeSelect}
          dateFormat={dateFormat}
          placeholderText={placeholderText}
          minDate={minDate}
          maxDate={maxDate}
          className={cn(
            "flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm",
            "placeholder:text-gray-400",
            "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
            "disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-red-500 focus:ring-red-500",
            className
          )}
          wrapperClassName="w-full"
          {...props}
        />
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      </div>
    );
  }
);
DatePicker.displayName = "DatePicker";

export { DatePicker };
