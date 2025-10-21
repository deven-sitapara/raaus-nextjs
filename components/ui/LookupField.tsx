'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';

interface LookupOption {
  id: string;
  name: string;
}

interface LookupFieldProps {
  options: LookupOption[];
  value: string; // ID value stored in form
  onChange: (id: string) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  error?: string;
}

/**
 * LookupField Component
 * A searchable dropdown that stores IDs but displays names
 * - Main field is read-only (button)
 * - Search bar appears inside dropdown popup
 * - Keyboard navigation support
 */
export default function LookupField({
  options,
  value,
  onChange,
  placeholder = 'Search and select...',
  label,
  required = false,
  error
}: LookupFieldProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Memoize options to prevent unnecessary re-renders
  const memoizedOptions = useMemo(() => options, [options]);

  // Get display name from ID
  const displayValue = useMemo(() => {
    if (!value?.trim()) return '';
    return memoizedOptions.find(opt => opt.id === value)?.name || '';
  }, [value, memoizedOptions]);

  // Filter options based on search
  const filteredOptions = useMemo(() => 
    memoizedOptions.filter(opt =>
      opt.name.toLowerCase().includes(searchQuery.toLowerCase())
    ),
    [memoizedOptions, searchQuery]
  );

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (listRef.current && highlightedIndex >= 0) {
      const element = listRef.current.children[highlightedIndex] as HTMLElement;
      element?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [highlightedIndex]);

  const handleSelect = (option: LookupOption) => {
    onChange(option.id); // Pass only ID to form
    setIsOpen(false);
    setSearchQuery('');
    setHighlightedIndex(0);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setSearchQuery('');
    setHighlightedIndex(0);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (['Enter', ' ', 'ArrowDown'].includes(e.key)) {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < filteredOptions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev > 0 ? prev - 1 : filteredOptions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredOptions[highlightedIndex]) {
          handleSelect(filteredOptions[highlightedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setSearchQuery('');
        break;
    }
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      {/* Label */}
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1" style={{ color: '#374151 !important' }}>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* Trigger Button (Read-only) */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        className={`
          w-full px-3 py-2 text-left bg-white border rounded-md shadow-sm
          flex items-center justify-between cursor-pointer hover:border-gray-400
          ${error ? 'border-red-500' : 'border-gray-300'}
          ${isOpen ? 'ring-2 ring-blue-500 border-blue-500' : ''}
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          transition-all duration-200
        `}
      >
        <span className={displayValue ? 'text-gray-900' : 'text-gray-500'}>
          {displayValue || placeholder}
        </span>
        <div className="flex items-center gap-2">
          {/* Clear button */}
          {displayValue && (
            <svg
              onClick={handleClear}
              className="h-4 w-4 text-gray-400 hover:text-gray-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
          {/* Chevron */}
          <svg
            className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
          {/* Search Bar */}
          <div className="sticky top-0 p-2 bg-white border-b border-gray-200">
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setHighlightedIndex(0);
                }}
                onKeyDown={handleKeyDown}
                placeholder="Type to search..."
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Options List */}
          <div ref={listRef} className="max-h-60 overflow-y-auto overscroll-contain">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option, index) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => handleSelect(option)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  className={`
                    w-full px-3 py-2 text-left hover:bg-blue-50 transition-colors
                    ${index === highlightedIndex ? 'bg-blue-50 text-gray-900' : 'text-gray-700'}
                    ${value === option.id ? 'bg-blue-100 font-medium text-gray-900' : ''}
                  `}
                >
                  {option.name}
                </button>
              ))
            ) : (
              <div className="px-3 py-4 text-center text-gray-500">No results found</div>
            )}
          </div>

          {/* Footer */}
          {filteredOptions.length > 0 && (
            <div className="sticky bottom-0 px-3 py-2 bg-gray-50 border-t border-gray-200 text-xs text-gray-500">
              Showing {filteredOptions.length} of {memoizedOptions.length} results
            </div>
          )}
        </div>
      )}
    </div>
  );
}
