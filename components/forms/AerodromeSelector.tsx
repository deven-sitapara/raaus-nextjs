"use client";

import { useState, useEffect } from "react";
import SearchableDropdown from "@/components/ui/SearchableDropdown";

interface AerodromeData {
  lastUpdated: string;
  count: number;
  aerodromes: string[];
}

export default function AerodromeSelector() {
  const [aerodromeData, setAerodromeData] = useState<AerodromeData | null>(
    null
  );
  const [selectedAerodrome, setSelectedAerodrome] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load aerodrome data from JSON file
    fetch("/data/aerodrome-codes.json")
      .then((res) => res.json())
      .then((data: AerodromeData) => {
        setAerodromeData(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load aerodrome data:", err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="p-4">
        <p>Loading aerodrome data...</p>
      </div>
    );
  }

  if (!aerodromeData) {
    return (
      <div className="p-4">
        <p className="text-red-500">Failed to load aerodrome data</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl">
      <h2 className="text-2xl font-bold mb-4">Aerodrome Selector</h2>

      <p className="text-sm text-gray-600 mb-4">
        Last updated: {new Date(aerodromeData.lastUpdated).toLocaleString()}
        <br />
        Total aerodromes: {aerodromeData.count}
      </p>

      <SearchableDropdown
        options={aerodromeData.aerodromes}
        value={selectedAerodrome}
        onChange={setSelectedAerodrome}
        label="Select Aerodrome"
        placeholder="Search for an aerodrome..."
        required
      />

      {selectedAerodrome && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-sm font-medium text-blue-900">
            Selected: <span className="font-bold">{selectedAerodrome}</span>
          </p>
        </div>
      )}

      {/* Example Usage in a Form */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold mb-2">Example Form Usage:</h3>
        <pre className="text-xs bg-white p-3 rounded border overflow-x-auto">
          {`<SearchableDropdown
  options={aerodromeData.aerodromes}
  value={formData.aerodrome}
  onChange={(value) => setFormData({...formData, aerodrome: value})}
  label="Aerodrome"
  placeholder="Select aerodrome..."
  required
  error={errors.aerodrome}
/>`}
        </pre>
      </div>
    </div>
  );
}
