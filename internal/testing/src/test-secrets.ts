/**
 * Centralized Test Secrets
 *
 * All non-RFC test secrets used across the test suite.
 * These are arbitrary values with no real-world significance.
 *
 * For RFC-standardized test vectors, see rfc-test-vectors.ts.
 */

/** 20-byte Base32 secret used in HOTP class and otplib shared tests */
export const TEST_SECRET_HOTP_BASE32 = "GHDHB5FUNZ2Z4OT7PB2BUPHBIDR2J337";

/** Base32 encoding of RFC base secret "12345678901234567890" (derived, not in RFC) */
export const TEST_SECRET_RFC_BASE32 = "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ";

/** 10-byte Base32 secret used in URI parsing and serialization tests */
export const TEST_SECRET_PARSE_BASE32 = "JBSWY3DPEHPK3PXP";

/** Base32 secret with padding, used in CLI otplibx tests */
export const TEST_SECRET_CLI = "YNA3WOLVGZTOGOMLZ6QWD6VKIE======";

/** 20-byte Base32 secret for guardrails tests (doubled TEST_SECRET_PARSE_BASE32) */
export const TEST_SECRET_GUARDRAILS = "JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP";

/** Hex-encoded 16-byte secret ("HelloGoodMorning") */
export const TEST_SECRET_HEX = "48656c6c6f476f6f644d6f726e696e67";

/** Invalid hex secret with 0x prefix (for error handling tests) */
export const TEST_SECRET_HEX_INVALID = "0x48656c6c6f476f6f644d6f726e696e67";

/** Invalid hex encoding of RFC base secret with 0x prefix (for error handling tests) */
export const TEST_SECRET_RFC_HEX_INVALID = "0x3132333435363738393031323334353637383930";

/** Arbitrary Base32 secret for bug report scenario (#739) */
export const TEST_SECRET_BUG_REPORT = "243G2YOOEZWSZSIZOYNKCSIQ5HYUZRLX";
