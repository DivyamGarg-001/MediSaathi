// Indian mobile phone validation/normalization
// Accepts: 9876543210, +91 9876543210, +919876543210, 91-98765-43210, etc.
// Stores canonically as: +91XXXXXXXXXX
// First digit of the 10-digit part must be 6, 7, 8, or 9 (TRAI rule).

const VALID_FIRST_DIGITS = ['6', '7', '8', '9']

export function normalizePhone(input: string): string | null {
  const digits = input.replace(/\D/g, '')

  let mobile: string
  if (digits.length === 10) {
    mobile = digits
  } else if (digits.length === 12 && digits.startsWith('91')) {
    mobile = digits.slice(2)
  } else if (digits.length === 13 && digits.startsWith('091')) {
    mobile = digits.slice(3)
  } else {
    return null
  }

  if (!VALID_FIRST_DIGITS.includes(mobile[0])) return null

  return `+91${mobile}`
}

export function isValidIndianMobile(input: string): boolean {
  return normalizePhone(input) !== null
}
