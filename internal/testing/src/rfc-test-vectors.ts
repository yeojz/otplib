/**
 * RFC Test Vectors for Runtime Compatibility Testing
 *
 * Contains test vectors from:
 * - RFC 4226 (HOTP) Appendix D
 * - RFC 6238 (TOTP) Appendix B
 *
 * This is the single source of truth for all test vectors across all runtimes.
 */

import { hexToNumber } from "./utils.js";

/**
 * Convert hex string to number
 * Used for comparing against RFC 6238 intermediate T (time step) values
 */
export { hexToNumber };

/**
 * Base secret from RFC specifications
 * ASCII: "12345678901234567890" (20 bytes)
 */
export const BASE_SECRET = "12345678901234567890";

/**
 * Base secret in Base32 encoding
 * Base32: "JBSWY3DPEHPK3PXP" (16 chars)
 */
export const BASE_SECRET_BASE32 = "JBSWY3DPEHPK3PXP";

/**
 * RFC 4226 Appendix D - HOTP Test Vectors
 * Secret: "12345678901234567890" in ASCII (20 bytes)
 *
 * The `hmac` field contains the intermediate HMAC-SHA-1 values from Table 1,
 * which allows testing the HMAC computation layer independently.
 */
export const RFC4226_VECTORS = [
  { counter: 0, expected: "755224", hmac: "cc93cf18508d94934c64b65d8ba7667fb7cde4b0" },
  { counter: 1, expected: "287082", hmac: "75a48a19d4cbe100644e8ac1397eea747a2d33ab" },
  { counter: 2, expected: "359152", hmac: "0bacb7fa082fef30782211938bc1c5e70416ff44" },
  { counter: 3, expected: "969429", hmac: "66c28227d03a2d5529262ff016a1e6ef76557ece" },
  { counter: 4, expected: "338314", hmac: "a904c900a64b35909874b33e61c5938a8e15ed1c" },
  { counter: 5, expected: "254676", hmac: "a37e783d7b7233c083d4f62926c7a25f238d0316" },
  { counter: 6, expected: "287922", hmac: "bc9cd28561042c83f219324d3c607256c03272ae" },
  { counter: 7, expected: "162583", hmac: "a4fb960c0bc06e1eabb804e5b397cdc4b45596fa" },
  { counter: 8, expected: "399871", hmac: "1b3c89f65e6c9e883012052823443f048b4332db" },
  { counter: 9, expected: "520489", hmac: "1637409809a679dc698207310c8c7fc07290d9e5" },
] as const;

/**
 * RFC 6238 Appendix B - TOTP Test Vectors
 *
 * Note: RFC 6238 uses different secret lengths for each algorithm:
 * - SHA1: 20-byte secret
 * - SHA256: 32-byte secret (padded)
 * - SHA512: 64-byte secret (padded)
 *
 * The `t` field contains the "Value of T (hex)" from the RFC, which is the
 * time step counter. This allows testing the time-to-counter conversion
 * independently of the OTP generation.
 */
export const RFC6238_VECTORS = {
  sha1: {
    // SHA1 uses 20-byte secret (the base secret as-is)
    secret: BASE_SECRET,
    vectors: [
      { epoch: 59, expected: "94287082", t: "0000000000000001" },
      { epoch: 1111111109, expected: "07081804", t: "00000000023523ec" },
      { epoch: 1111111111, expected: "14050471", t: "00000000023523ed" },
      { epoch: 1234567890, expected: "89005924", t: "000000000273ef07" },
      { epoch: 2000000000, expected: "69279037", t: "0000000003f940aa" },
      { epoch: 20000000000, expected: "65353130", t: "0000000027bc86aa" },
    ],
  },
  sha256: {
    // SHA256 uses 32-byte secret (base secret repeated to 32 bytes)
    secret: BASE_SECRET + BASE_SECRET.slice(0, 12),
    vectors: [
      { epoch: 59, expected: "46119246", t: "0000000000000001" },
      { epoch: 1111111109, expected: "68084774", t: "00000000023523ec" },
      { epoch: 1111111111, expected: "67062674", t: "00000000023523ed" },
      { epoch: 1234567890, expected: "91819424", t: "000000000273ef07" },
      { epoch: 2000000000, expected: "90698825", t: "0000000003f940aa" },
      { epoch: 20000000000, expected: "77737706", t: "0000000027bc86aa" },
    ],
  },
  sha512: {
    // SHA512 uses 64-byte secret (base secret repeated to 64 bytes)
    secret: BASE_SECRET.repeat(3) + BASE_SECRET.slice(0, 4),
    vectors: [
      { epoch: 59, expected: "90693936", t: "0000000000000001" },
      { epoch: 1111111109, expected: "25091201", t: "00000000023523ec" },
      { epoch: 1111111111, expected: "99943326", t: "00000000023523ed" },
      { epoch: 1234567890, expected: "93441116", t: "000000000273ef07" },
      { epoch: 2000000000, expected: "38618901", t: "0000000003f940aa" },
      { epoch: 20000000000, expected: "47863826", t: "0000000027bc86aa" },
    ],
  },
} as const;
