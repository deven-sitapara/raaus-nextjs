// Validation regex patterns from form specifications

export const validationPatterns = {
  // Name validation: 3-16 characters, letters, spaces, and hyphens
  name: /^[a-zA-Z -]{3,16}$/,

  // Email validation - RFC 5322 compliant
  email: /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,

  // Member number: 5-6 digits
  memberNumber: /^\d{5,6}$/,

  // Registration number suffix: 4 digits
  registrationSuffix: /^\d{4}$/,

  // Alphanumeric with spaces
  alphanumericWithSpaces: /^[a-zA-Z0-9\s]*$/,

  // Numbers only
  numbersOnly: /^[0-9]*$/,

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
  name: "Must be 3-16 characters, letters, spaces, and hyphens only",
  email: "Please enter a valid email address (e.g., user@example.com)",
  memberNumber: "Must be 5-6 digits",
  registrationSuffix: "Must be exactly 4 digits",
  required: "This field is required",
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

  // Remove common formatting characters for validation
  const cleanNumber = phoneNumber.replace(/[\s\-\(\)\.]/g, '');
  
  // Check if it matches the country-specific pattern
  const pattern = validationPatterns.phone[country];
  return pattern.test(phoneNumber);
};

/**
 * Get phone validation error message for country
 */
export const getPhoneValidationMessage = (country: 'AU' | 'CA' | 'GB' | 'US'): string => {
  return validationMessages.phone[country] || validationMessages.phone.generic;
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
