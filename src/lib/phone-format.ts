/**
 * Formats a phone number string into (XXX) XXX-XXXX format
 * @param phoneNumber The phone number to format
 * @returns Formatted phone number string
 */
export function formatPhoneNumber(phoneNumber: string): string {
  // Remove all non-digit characters
  const cleaned = phoneNumber.replace(/\D/g, '');
  
  // If the number is not 10 digits, return as is
  if (cleaned.length !== 10) {
    return phoneNumber;
  }
  
  // Format as (XXX) XXX-XXXX
  return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
}

/**
 * Validates if a phone number string is a valid US phone number
 * @param phoneNumber The phone number to validate
 * @returns boolean indicating if the phone number is valid
 */
export function isValidPhoneNumber(phoneNumber: string): boolean {
  // Remove all non-digit characters
  const cleaned = phoneNumber.replace(/\D/g, '');
  
  // Check if it's a 10-digit number
  return cleaned.length === 10;
}

/**
 * Parses a phone number into its components
 * @param phoneNumber The phone number to parse
 * @returns Object containing phone number components
 */
export function parsePhoneNumber(phoneNumber: string): {
  countryCode?: string;
  areaCode: string;
  number: string;
  extension?: string;
} {
  const digits = phoneNumber.replace(/\D/g, '');
  const extensionMatch = phoneNumber.match(/x(\d+)$/i);
  
  let countryCode: string | undefined;
  let areaCode: string;
  let number: string;
  
  if (digits.length > 10) {
    // International number
    countryCode = digits.slice(0, digits.length - 10);
    areaCode = digits.slice(-10, -7);
    number = digits.slice(-7);
  } else {
    // US number
    areaCode = digits.slice(0, 3);
    number = digits.slice(3);
  }
  
  return {
    countryCode,
    areaCode,
    number: `${number.slice(0, 3)}-${number.slice(3)}`,
    extension: extensionMatch ? extensionMatch[1] : undefined
  };
} 