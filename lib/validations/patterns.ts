// Validation regex patterns from form specifications

export const validationPatterns = {
  // Name validation: 3-16 characters, letters, spaces, and hyphens
  name: /^[a-zA-Z -]{3,16}$/,

  // Email validation
  email: /^[\p{L}0-9._-]+@[\p{L}0-9.-]+\.[\p{L}]+$/u,

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
};

export const validationMessages = {
  name: "Must be 3-16 characters, letters, spaces, and hyphens only",
  email: "Please enter a valid email address",
  memberNumber: "Must be 5-6 digits",
  registrationSuffix: "Must be exactly 4 digits",
  required: "This field is required",
  phone: "Please enter a valid phone number",
};
