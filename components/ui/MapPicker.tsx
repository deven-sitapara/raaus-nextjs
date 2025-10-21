"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useMapEvents } from "react-leaflet";
import type { LeafletMouseEvent } from "leaflet";

// Dynamically import map components to avoid SSR issues
const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import("react-leaflet").then((mod) => mod.Marker),
  { ssr: false }
);

interface MapPickerProps {
  latitude?: string;
  longitude?: string;
  onLocationSelect: (lat: string, lng: string) => void;
  label?: string;
  required?: boolean;
  error?: string;
}

interface LocationMarkerProps {
  onLocationSelect: (lat: string, lng: string) => void;
  position: [number, number] | null;
}

// Component to handle map clicks
function LocationMarker({ onLocationSelect, position }: LocationMarkerProps) {
  const [markerPosition, setMarkerPosition] = useState<[number, number] | null>(
    position || null
  );

  const map = useMapEvents({
    click(e: LeafletMouseEvent) {
      const { lat, lng } = e.latlng;
      const newPosition: [number, number] = [lat, lng];
      setMarkerPosition(newPosition);
      onLocationSelect(lat.toFixed(6), lng.toFixed(6));
      
      // Center map on clicked location
      map.flyTo(newPosition, map.getZoom());
    },
  });

  // Update marker position when position prop changes
  useEffect(() => {
    if (position) {
      setMarkerPosition(position);
      map.flyTo(position, 13);
    }
  }, [position, map]);

  return markerPosition ? <Marker position={markerPosition} /> : null;
}

export default function MapPicker({
  latitude,
  longitude,
  onLocationSelect,
  label,
  required = false,
  error,
}: MapPickerProps) {
  const [isClient, setIsClient] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>([-25.2744, 133.7751]); // Australia center
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    setIsClient(true);

    // Load Leaflet CSS
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    link.integrity = "sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=";
    link.crossOrigin = "";
    document.head.appendChild(link);

    // Set initial position if provided
    if (latitude && longitude) {
      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);
      if (!isNaN(lat) && !isNaN(lng)) {
        setMapCenter([lat, lng]);
      }
    }

    return () => {
      document.head.removeChild(link);
    };
  }, [latitude, longitude]);

  const handleManualInput = (type: "lat" | "lng", value: string) => {
    // Allow only numbers, decimal point, and minus sign
    const cleaned = value.replace(/[^0-9.-]/g, "");
    
    if (type === "lat") {
      onLocationSelect(cleaned, longitude || "");
      const lat = parseFloat(cleaned);
      const lng = parseFloat(longitude || "0");
      if (!isNaN(lat) && !isNaN(lng)) {
        setMapCenter([lat, lng]);
      }
    } else {
      onLocationSelect(latitude || "", cleaned);
      const lat = parseFloat(latitude || "0");
      const lng = parseFloat(cleaned);
      if (!isNaN(lat) && !isNaN(lng)) {
        setMapCenter([lat, lng]);
      }
    }
  };

  const getCurrentLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude.toFixed(6);
          const lng = position.coords.longitude.toFixed(6);
          onLocationSelect(lat, lng);
          setMapCenter([parseFloat(lat), parseFloat(lng)]);
        },
        (error) => {
          console.error("Error getting location:", error);
          alert("Unable to get your current location. Please select on map or enter manually.");
        }
      );
    } else {
      alert("Geolocation is not supported by your browser.");
    }
  };

  const searchLocation = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5`
      );
      const data = await response.json();
      setSearchResults(data);
      
      if (data.length > 0) {
        const firstResult = data[0];
        const lat = parseFloat(firstResult.lat).toFixed(6);
        const lng = parseFloat(firstResult.lon).toFixed(6);
        onLocationSelect(lat, lng);
        setMapCenter([parseFloat(lat), parseFloat(lng)]);
      }
    } catch (error) {
      console.error("Error searching location:", error);
      alert("Unable to search location. Please try again.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      searchLocation();
    }
  };

  const selectSearchResult = (result: any) => {
    const lat = parseFloat(result.lat).toFixed(6);
    const lng = parseFloat(result.lon).toFixed(6);
    onLocationSelect(lat, lng);
    setMapCenter([parseFloat(lat), parseFloat(lng)]);
    setSearchQuery("");
    setSearchResults([]);
  };

  if (!isClient) {
    return (
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">
          {label || "Location Coordinates"}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <div className="h-48 bg-gray-100 rounded-md flex items-center justify-center">
          <p className="text-gray-500">Loading map...</p>
        </div>
      </div>
    );
  }

  const position: [number, number] = [
    parseFloat(latitude || "0") || mapCenter[0],
    parseFloat(longitude || "0") || mapCenter[1],
  ];

  return (
    <div className="bg-blue-50/30 rounded-lg p-4 border border-blue-100">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-3">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* Search and Location Controls */}
      <div className="space-y-2 mb-3">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleSearchKeyPress}
              placeholder="Search for a city, suburb, or address..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setSearchResults([]);
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                aria-label="Clear search"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={searchLocation}
            disabled={!searchQuery.trim() || isSearching}
            className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSearching ? "Searching..." : "Search"}
          </button>
          <button
            type="button"
            onClick={getCurrentLocation}
            className="px-4 py-2 text-sm font-medium bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Use My Location
          </button>
        </div>

        {searchResults.length > 0 && (
          <div className="border border-gray-300 rounded-md bg-white shadow-lg max-h-48 overflow-y-auto">
            {searchResults.map((result, index) => (
              <button
                key={index}
                type="button"
                onClick={() => selectSearchResult(result)}
                className="w-full px-4 py-3 text-left hover:bg-blue-50 border-b border-gray-100 last:border-b-0"
              >
                <div className="font-medium text-gray-900">{result.display_name}</div>
                <div className="text-sm text-gray-500 mt-1">
                  📍 Lat: {parseFloat(result.lat).toFixed(4)}, Lng: {parseFloat(result.lon).toFixed(4)}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Map View */}
      <div className="rounded-md overflow-hidden border border-gray-300 shadow-sm">
        <div className="h-96">
          <MapContainer
            center={mapCenter}
            zoom={13}
            style={{ height: "100%", width: "100%" }}
            scrollWheelZoom={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <LocationMarker 
              onLocationSelect={onLocationSelect} 
              position={latitude && longitude && !isNaN(parseFloat(latitude)) && !isNaN(parseFloat(longitude)) ? position : null} 
            />
          </MapContainer>
        </div>
      </div>

      <p className="text-xs text-gray-600 mt-2">
        💡 Click anywhere on the map to set a location pin, or search for a location above.
      </p>

      {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
    </div>
  );
}
