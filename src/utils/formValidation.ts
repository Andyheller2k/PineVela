/**
 * PineVela Centralized Form Validation & Formatting Utilities
 * Strictly enforces email, phone number, physical address, digital address,
 * and identification document formats (Ghana Card, Voter ID, NHIS, Student ID, Passport, Driver's License).
 * 
 * When numeric-only IDs are selected, alphabets are blocked immediately.
 * Users cannot proceed unless all entries conform to required standards.
 */

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  sanitizedValue?: string;
}

export interface IdTypeConfig {
  id: string;
  name: string;
  placeholder: string;
  helperText: string;
  numericOnly: boolean;
  maxLength: number;
  formatMask?: string;
  formatInput: (val: string) => string;
  validate: (val: string) => ValidationResult;
}

/**
 * 1. Email Format Validator
 * Enforces standard RFC email formats: localpart@domain.tld
 */
export function validateEmail(email: string, fieldName = 'Email address'): ValidationResult {
  const trimmed = (email || '').trim().toLowerCase();
  if (!trimmed) {
    return { isValid: false, error: `${fieldName} is required.` };
  }
  // Standard robust email regex
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(trimmed)) {
    return {
      isValid: false,
      error: `Invalid ${fieldName.toLowerCase()} format. Must be like name@domain.com (e.g. kwame@gmail.com)`
    };
  }
  return { isValid: true, sanitizedValue: trimmed };
}

/**
 * 2. Phone Number Cleaner & Validator
 * Strips invalid characters (no letters allowed in phone inputs).
 */
export function cleanPhoneNumber(raw: string): string {
  if (!raw) return '';
  const trimmed = raw.trim();
  const startsWithPlus = trimmed.startsWith('+');
  // Keep only digits, spaces, and hyphens (and leading plus)
  const digitsAndAllowed = trimmed.replace(/[^0-9\s-]/g, '');
  if (startsWithPlus) {
    return `+${digitsAndAllowed.replace(/^\+*/, '')}`;
  }
  return digitsAndAllowed;
}

export function validatePhone(phone: string, fieldName = 'Phone number'): ValidationResult {
  const cleaned = cleanPhoneNumber(phone).trim();
  if (!cleaned) {
    return { isValid: false, error: `${fieldName} is required.` };
  }

  // Count pure digits
  const pureDigits = cleaned.replace(/\D/g, '');

  if (cleaned.startsWith('+')) {
    if (pureDigits.length < 10 || pureDigits.length > 15) {
      return {
        isValid: false,
        error: `${fieldName} with country code must contain between 10 and 15 digits (e.g. +233 24 123 4567).`
      };
    }
  } else {
    if (pureDigits.length !== 10) {
      return {
        isValid: false,
        error: `${fieldName} must be exactly 10 digits (e.g. 024 123 4567). Entered ${pureDigits.length} digits.`
      };
    }
    if (!cleaned.startsWith('0')) {
      return {
        isValid: false,
        error: `${fieldName} must start with '0' (e.g. 024XXXXXXX) or include international code '+233'.`
      };
    }
  }

  return { isValid: true, sanitizedValue: cleaned };
}

/**
 * 3. Physical Address Validator
 * Ensures non-empty, minimum length, and contains street/area letters.
 */
export function validateAddress(address: string, fieldName = 'Physical address'): ValidationResult {
  const trimmed = (address || '').trim();
  if (!trimmed) {
    return { isValid: false, error: `${fieldName} is required.` };
  }
  if (trimmed.length < 5) {
    return {
      isValid: false,
      error: `${fieldName} must be at least 5 characters (e.g. Plot 14, University Road).`
    };
  }
  const hasLetters = /[a-zA-Z]/.test(trimmed);
  if (!hasLetters) {
    return {
      isValid: false,
      error: `${fieldName} must contain street or location name letters (no numbers only).`
    };
  }
  return { isValid: true, sanitizedValue: trimmed };
}

/**
 * 4. Digital Address (GhanaPost GPS) Cleaner & Validator
 * Format: XX-XXX-XXXX or XX-XXXX-XXXX (e.g. GA-183-9324)
 */
export function formatDigitalAddress(raw: string): string {
  if (!raw) return '';
  return raw.toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 12);
}

export function validateDigitalAddress(gps: string, isRequired = false): ValidationResult {
  const formatted = formatDigitalAddress(gps).trim();
  if (!formatted) {
    if (isRequired) {
      return { isValid: false, error: 'Digital Address (GhanaPost GPS) is required.' };
    }
    return { isValid: true, sanitizedValue: '' };
  }

  const gpsRegex = /^[A-Z]{2}-[0-9]{3,4}-[0-9]{4}$/;
  if (!gpsRegex.test(formatted)) {
    return {
      isValid: false,
      error: 'Invalid Digital Address format. Must follow GhanaPost GPS pattern: XX-XXX-XXXX (e.g. GA-183-9324 or AK-483-2019).'
    };
  }
  return { isValid: true, sanitizedValue: formatted };
}

/**
 * 5. Identification Document Configurations
 * Distinct rules, input cleaners, masks, and validation for each ID type.
 */
export const ID_CONFIGS: Record<string, IdTypeConfig> = {
  'ghana_card': {
    id: 'ghana_card',
    name: 'Ghana Card (National ID)',
    placeholder: 'GHA-123456789-1',
    helperText: 'Format: GHA-XXXXXXXXX-X (GHA followed by 9 digits and 1 check digit)',
    numericOnly: false,
    maxLength: 15,
    formatMask: 'GHA-000000000-0',
    formatInput: (val: string) => {
      let clean = val.toUpperCase().replace(/[^A-Z0-9-]/g, '');
      if (clean.length > 15) clean = clean.slice(0, 15);
      return clean;
    },
    validate: (val: string): ValidationResult => {
      const trimmed = (val || '').trim().toUpperCase();
      if (!trimmed) return { isValid: false, error: 'Ghana Card PIN is required.' };
      const regex = /^GHA-[0-9]{9}-[0-9]$/;
      if (!regex.test(trimmed)) {
        return {
          isValid: false,
          error: 'Invalid Ghana Card PIN. Must strictly match GHA-XXXXXXXXX-X (e.g. GHA-729103982-1).'
        };
      }
      return { isValid: true, sanitizedValue: trimmed };
    }
  },

  'voter_id': {
    id: 'voter_id',
    name: 'Voter ID Card',
    placeholder: 'e.g. 1048291048 (10 digits)',
    helperText: 'Numbers only — strictly 10 numeric digits (no alphabets allowed)',
    numericOnly: true,
    maxLength: 10,
    formatInput: (val: string) => {
      // Strictly numbers: strip all non-digits
      return val.replace(/[^0-9]/g, '').slice(0, 10);
    },
    validate: (val: string): ValidationResult => {
      const clean = (val || '').trim();
      if (!clean) return { isValid: false, error: 'Voter ID number is required.' };
      if (/[^0-9]/.test(clean)) {
        return { isValid: false, error: 'Voter ID must contain NUMBERS ONLY. Alphabets are strictly not allowed.' };
      }
      if (clean.length !== 10) {
        return { isValid: false, error: `Voter ID must be exactly 10 digits (currently ${clean.length} digits).` };
      }
      return { isValid: true, sanitizedValue: clean };
    }
  },

  'nhis_card': {
    id: 'nhis_card',
    name: 'NHIS Card (Health Insurance)',
    placeholder: 'e.g. 29384019 (8 digits)',
    helperText: 'Numbers only — strictly 8 numeric digits (no alphabets allowed)',
    numericOnly: true,
    maxLength: 8,
    formatInput: (val: string) => {
      return val.replace(/[^0-9]/g, '').slice(0, 8);
    },
    validate: (val: string): ValidationResult => {
      const clean = (val || '').trim();
      if (!clean) return { isValid: false, error: 'NHIS card number is required.' };
      if (/[^0-9]/.test(clean)) {
        return { isValid: false, error: 'NHIS Card must contain NUMBERS ONLY. Alphabets are strictly not allowed.' };
      }
      if (clean.length !== 8) {
        return { isValid: false, error: `NHIS Card must be exactly 8 digits (currently ${clean.length} digits).` };
      }
      return { isValid: true, sanitizedValue: clean };
    }
  },

  'student_id': {
    id: 'student_id',
    name: 'University Student ID',
    placeholder: 'e.g. 10928374 (6-10 digits)',
    helperText: 'Numbers only — 6 to 10 numeric digits (no alphabets allowed)',
    numericOnly: true,
    maxLength: 10,
    formatInput: (val: string) => {
      return val.replace(/[^0-9]/g, '').slice(0, 10);
    },
    validate: (val: string): ValidationResult => {
      const clean = (val || '').trim();
      if (!clean) return { isValid: false, error: 'Student ID number is required.' };
      if (/[^0-9]/.test(clean)) {
        return { isValid: false, error: 'Student ID must contain NUMBERS ONLY. Alphabets are strictly not allowed.' };
      }
      if (clean.length < 6 || clean.length > 10) {
        return { isValid: false, error: 'Student ID number must be between 6 and 10 digits long.' };
      }
      return { isValid: true, sanitizedValue: clean };
    }
  },

  'passport': {
    id: 'passport',
    name: 'International Passport',
    placeholder: 'e.g. G1234567 (1 letter + 7-8 digits)',
    helperText: 'Format: 1 uppercase letter followed by 7-8 numeric digits (e.g. G1234567)',
    numericOnly: false,
    maxLength: 9,
    formatInput: (val: string) => {
      let clean = val.toUpperCase().replace(/[^A-Z0-9]/g, '');
      if (clean.length > 9) clean = clean.slice(0, 9);
      return clean;
    },
    validate: (val: string): ValidationResult => {
      const trimmed = (val || '').trim().toUpperCase();
      if (!trimmed) return { isValid: false, error: 'Passport number is required.' };
      const regex = /^[A-Z][0-9]{7,8}$/;
      if (!regex.test(trimmed)) {
        return {
          isValid: false,
          error: 'Invalid Passport format. Must start with 1 letter followed by 7 to 8 digits (e.g. G1234567).'
        };
      }
      return { isValid: true, sanitizedValue: trimmed };
    }
  },

  'driver_license': {
    id: 'driver_license',
    name: "Driver's License",
    placeholder: 'e.g. DL-10928374 or 8-14 characters',
    helperText: 'Format: 8-14 alphanumeric characters (e.g. DL-10928374)',
    numericOnly: false,
    maxLength: 14,
    formatInput: (val: string) => {
      return val.toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 14);
    },
    validate: (val: string): ValidationResult => {
      const trimmed = (val || '').trim().toUpperCase();
      if (!trimmed) return { isValid: false, error: "Driver's License number is required." };
      if (trimmed.length < 8 || trimmed.length > 14) {
        return { isValid: false, error: "Driver's License must be between 8 and 14 characters long." };
      }
      return { isValid: true, sanitizedValue: trimmed };
    }
  }
};

/**
 * Resolves standard ID config regardless of label variation in UI
 */
export function resolveIdConfig(selectedType: string): IdTypeConfig {
  const norm = (selectedType || '').toLowerCase();
  if (norm.includes('ghana') || norm.includes('nia') || norm.includes('national id')) {
    return ID_CONFIGS['ghana_card'];
  }
  if (norm.includes('voter')) {
    return ID_CONFIGS['voter_id'];
  }
  if (norm.includes('nhis') || norm.includes('health')) {
    return ID_CONFIGS['nhis_card'];
  }
  if (norm.includes('student') || norm.includes('university') || norm.includes('tertiary')) {
    return ID_CONFIGS['student_id'];
  }
  if (norm.includes('passport')) {
    return ID_CONFIGS['passport'];
  }
  if (norm.includes('driver') || norm.includes('license') || norm.includes('licence')) {
    return ID_CONFIGS['driver_license'];
  }
  return ID_CONFIGS['ghana_card'];
}
