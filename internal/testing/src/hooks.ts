/**
 * Test helpers for OTPHooks
 *
 * Provides a Steam Guard-style encoding for testing custom hook integration.
 * Steam Guard uses a 5-character alphanumeric token instead of the standard
 * 6-digit numeric OTP.
 */

/**
 * Character set used by Steam Guard for token encoding
 */
export const STEAM_CHARS = "23456789BCDFGHJKMNPQRTVWXY";

/**
 * Encodes a truncated HMAC value into a Steam Guard-style token.
 *
 * @param truncatedValue - 31-bit unsigned integer from dynamic truncation
 * @param digits - Desired token length
 * @returns Encoded token string using STEAM_CHARS alphabet
 */
export function steamEncodeToken(truncatedValue: number, digits: number): string {
  let code = "";
  let value = truncatedValue;
  for (let i = 0; i < digits; i++) {
    code += STEAM_CHARS[value % STEAM_CHARS.length];
    value = Math.floor(value / STEAM_CHARS.length);
  }
  return code;
}

/**
 * Validates that a token contains only valid Steam Guard characters.
 *
 * @param token - Token string to validate
 * @param digits - Expected token length
 * @throws {Error} If token length or characters are invalid
 */
export function steamValidateToken(token: string, digits: number): void {
  if (token.length !== digits) {
    throw new Error(`Expected ${digits} characters, got ${token.length}`);
  }
  for (const ch of token) {
    if (!STEAM_CHARS.includes(ch)) {
      throw new Error(`Invalid character: ${ch}`);
    }
  }
}

/**
 * Static truncation: always uses the first 4 bytes (offset 0)
 * instead of the RFC 4226 dynamic offset.
 *
 * Useful for deterministic testing of the truncateDigest hook.
 *
 * @param hmacResult - Raw HMAC digest as a byte array
 * @returns 31-bit unsigned integer
 */
export function staticTruncate(hmacResult: Uint8Array): number {
  return (
    ((hmacResult[0] & 0x7f) << 24) | (hmacResult[1] << 16) | (hmacResult[2] << 8) | hmacResult[3]
  );
}
