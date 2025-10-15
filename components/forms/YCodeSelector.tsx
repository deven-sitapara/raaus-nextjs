"use client";

import { useState, useEffect } from "react";
import SearchableDropdown from "@/components/ui/SearchableDropdown";
import optionsdata from './aerodrome-codes.json';

interface AerodromeData {
  lastUpdated: string;
  count: number;
  aerodromes: string[];
}

interface YCodeSelectorProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  error?: string;
  disabled?: boolean;
}

export default function YCodeSelector({
  value,
  onChange,
  label = "Y Code",
  placeholder = "Search for an aerodrome...",
  required = false,
  error,
  disabled = false,
}: YCodeSelectorProps) {
  const [aerodromeData, setAerodromeData] = useState<AerodromeData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load aerodrome data from JSON file
    setAerodromeData(optionsdata);
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="w-full">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <div className="p-3 bg-gray-50 border border-gray-300 rounded-md text-sm text-gray-500">
          Loading aerodrome codes...
        </div>
      </div>
    );
  }

  if (!aerodromeData) {
    return (
      <div className="w-full">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <div className="p-3 bg-red-50 border border-red-300 rounded-md text-sm text-red-600">
          Failed to load aerodrome codes. Please try again.
        </div>
      </div>
    );
  }

  return (
    <SearchableDropdown
      options={aerodromeData.aerodromes}
      value={value}
      onChange={onChange}
      label={label}
      placeholder={placeholder}
      required={required}
      error={error}
      disabled={disabled}
    />
  );
}
