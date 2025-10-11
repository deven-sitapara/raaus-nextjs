// Validation regex patterns from form specifications

export const validationPatterns = {
  // Name validation: 3-30 characters, letters, spaces only (updated to allow up to 30 chars)
  name: /^[a-zA-Z ]{3,30}$/,

  // Email validation - RFC 5322 compliant
  email: /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,

  // Member number: exactly 6 digits
  memberNumber: /^\d{6}$/,

  // Registration number suffix: exactly 4 digits
  registrationSuffix: /^\d{4}$/,

  // Aircraft registration format: 2-3 alphanumeric chars, hyphen, 4 alphanumeric chars (e.g., 10-1122, E13-1199, VH-ABCD)
  aircraftRegistration: /^[a-zA-Z0-9]{2,3}-[a-zA-Z0-9]{4}$/,

  // Alphanumeric with spaces
  alphanumericWithSpaces: /^[a-zA-Z0-9\s]*$/,

  // Numbers only (integers)
  numbersOnly: /^[0-9]+$/,

  // Decimal numbers (supports integers and decimals like 12.2, 850.3, 5280.7)
  decimalNumber: /^\d+(\.\d+)?$/,

  // Alphanumeric with hyphens, underscores, and spaces (for aircraft fields)
  alphanumericDashSpace: /^[a-zA-Z0-9 -]{3,16}$/,

  // Alphanumeric with hyphens and underscores
  alphanumericDashUnderscore: /^[a-z0-9_-]{3,16}$/,

  // Alphanumeric with hyphens, underscores, and spaces
  alphanumericDashUnderscoreSpace: /^[a-z0-9_ /-]{3,16}$/i,

  // Phone number patterns by country
  phone: {
    // Australia: +61 4XX XXX XXX or 04XX XXX XXX (mobile), +61 2/3/7/8 XXXX XXXX (landline)
    AU: /^(?:\+61|0)[2-478](?:[ -]?[0-9]){8}$/,
    // Canada/US: +1 (XXX) XXX-XXXX or variations
    CA: /^(?:\+1|1)?[-.\s]?\(?[2-9][0-9]{2}\)?[-.\s]?[2-9][0-9]{2}[-.\s]?[0-9]{4}$/,
    US: /^(?:\+1|1)?[-.\s]?\(?[2-9][0-9]{2}\)?[-.\s]?[2-9][0-9]{2}[-.\s]?[0-9]{4}$/,
    // UK: +44 XXXX XXXXXX or 0XXXX XXXXXX
    GB: /^(?:\+44|0)[1-9][0-9]{9,10}$/,
  },
};

export const validationMessages = {
  name: "Must be 3-30 characters, letters and spaces only",
  email: "Please enter a valid email address (e.g., user@example.com)",
  memberNumber: "Must be exactly 6 digits",
  registrationSuffix: "Must be exactly 4 digits",
  aircraftRegistration: "Format: XX-XXXX or XXX-XXXX (e.g., 10-1122, E13-1199)",
  required: "This field is required",
  decimalNumber: "Please enter a valid number (e.g., 12.2 or 850.3)",
  alphanumeric: "Only alphanumeric characters allowed",
  minLength: "Invalid minimum characters length",
  invalidValue: "Entered value is invalid",
  phone: {
    AU: "Please enter a valid Australian phone number (e.g., 0412 345 678 or +61 412 345 678)",
    CA: "Please enter a valid Canadian phone number (e.g., (416) 555-0123)",
    US: "Please enter a valid US phone number (e.g., (555) 123-4567)",
    GB: "Please enter a valid UK phone number (e.g., 07700 900123)",
    generic: "Please enter a valid phone number for the selected country",
  },
};

/**
 * Validate phone number based on selected country
 */
export const validatePhoneNumber = (phoneNumber: string, country: 'AU' | 'CA' | 'GB' | 'US'): boolean => {
  if (!phoneNumber || phoneNumber.trim() === '') {
    return false;
  }

  // Default to AU if country is undefined or invalid
  const validCountry = country && validationPatterns.phone[country] ? country : 'AU';

  // Remove common formatting characters for validation
  const cleanNumber = phoneNumber.replace(/[\s\-\(\)\.]/g, '');
  
  // Check if it matches the country-specific pattern
  const pattern = validationPatterns.phone[validCountry];
  return pattern.test(phoneNumber);
};

/**
 * Get phone validation error message for country
 */
export const getPhoneValidationMessage = (country: 'AU' | 'CA' | 'GB' | 'US'): string => {
  // Default to AU if country is undefined or invalid
  const validCountry = country && validationMessages.phone[country] ? country : 'AU';
  return validationMessages.phone[validCountry] || validationMessages.phone.generic;
};

/**
 * Validate email address
 */
export const validateEmail = (email: string): boolean => {
  if (!email || email.trim() === '') {
    return false;
  }

  // Check basic format
  if (!validationPatterns.email.test(email)) {
    return false;
  }

  // Additional checks
  const parts = email.split('@');
  if (parts.length !== 2) {
    return false;
  }

  const [localPart, domain] = parts;
  
  // Local part should not start or end with a dot
  if (localPart.startsWith('.') || localPart.endsWith('.')) {
    return false;
  }

  // Domain should have at least one dot
  if (!domain.includes('.')) {
    return false;
  }

  // Domain extension should be at least 2 characters
  const domainParts = domain.split('.');
  const extension = domainParts[domainParts.length - 1];
  if (extension.length < 2) {
    return false;
  }

  return true;
};

/**
 * Validate decimal number (supports integers and decimals)
 */
export const validateDecimalNumber = (value: string): boolean => {
  if (!value || value.trim() === '') {
    return false;
  }

  return validationPatterns.decimalNumber.test(value.trim());
};

/**
 * Validate alphanumeric with spaces
 */
export const validateAlphanumericWithSpaces = (value: string): boolean => {
  if (!value || value.trim() === '') {
    return true; // Empty is valid (use required: true for mandatory fields)
  }

  return validationPatterns.alphanumericWithSpaces.test(value);
};

/**
 * Validate string length
 */
export const validateLength = (value: string, min: number, max?: number): boolean => {
  if (!value) return false;
  
  const length = value.trim().length;
  if (length < min) return false;
  if (max && length > max) return false;
  
  return true;
};

