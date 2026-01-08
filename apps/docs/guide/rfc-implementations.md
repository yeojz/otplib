# RFC Implementations

otplib is fully compliant with the following RFCs:

## RFC 4226 - HOTP: An HMAC-Based One-Time Password Algorithm

### Key Requirements

| Requirement                   | Status | Notes                            |
| ----------------------------- | ------ | -------------------------------- |
| HMAC-SHA-1                    | Yes    | Default hash algorithm           |
| Counter as 8-byte big-endian  | Yes    | `counterToBytes()` in core       |
| Dynamic truncation            | Yes    | `dynamicTruncate()` in core      |
| Digit extraction (6-8 digits) | Yes    | Configurable `digits` parameter  |
| Look-ahead synchronization    | Yes    | Configurable `window` parameter  |
| Secret minimum 128 bits       | Yes    | `validateSecret()` enforces this |
| Secret recommended 160 bits   | Yes    | `generateSecret()` uses 20 bytes |

### Test Vectors

otplib passes all RFC 4226 Appendix D test vectors:

| Counter | Expected | Actual | Status |
| ------- | -------- | ------ | ------ |
| 0       | 755224   | 755224 | Pass   |
| 1       | 287082   | 287082 | Pass   |
| 2       | 359152   | 359152 | Pass   |
| 3       | 969429   | 969429 | Pass   |
| 4       | 338314   | 338314 | Pass   |
| 5       | 254676   | 254676 | Pass   |
| 6       | 287922   | 287922 | Pass   |
| 7       | 162583   | 162583 | Pass   |
| 8       | 399871   | 399871 | Pass   |
| 9       | 520489   | 520489 | Pass   |

### Intermediate HMAC-SHA-1 Values

otplib also verifies the intermediate HMAC-SHA-1 computation against RFC 4226 Appendix D. This ensures the crypto plugin is functioning correctly before truncation.

| Counter | HMAC-SHA-1 (hex)                           | Status |
| ------- | ------------------------------------------ | ------ |
| 0       | `cc93cf18508d94934c64b65d8ba7667fb7cde4b0` | Pass   |
| 1       | `75a48a19d4cbe100644e8ac1397eea747a2d33ab` | Pass   |
| 2       | `0bacb7fa082fef30782211938bc1c5e70416ff44` | Pass   |
| 3       | `66c28227d03a2d5529262ff016a1e6ef76557ece` | Pass   |
| 4       | `a904c900a64b35909874b33e61c5938a8e15ed1c` | Pass   |
| 5       | `a37e783d7b7233c083d4f62926c7a25f238d0316` | Pass   |
| 6       | `bc9cd28561042c83f219324d3c607256c03272ae` | Pass   |
| 7       | `a4fb960c0bc06e1eabb804e5b397cdc4b45596fa` | Pass   |
| 8       | `1b3c89f65e6c9e883012052823443f048b4332db` | Pass   |
| 9       | `1637409809a679dc698207310c8c7fc07290d9e5` | Pass   |

**Test File:** [`packages/hotp/src/rfc4226.test.ts`](../packages/hotp/src/rfc4226.test.ts)

## RFC 6238 - TOTP: Time-Based One-Time Password Algorithm

### Key Requirements

| Requirement          | Status | Notes                       |
| -------------------- | ------ | --------------------------- |
| Based on HOTP        | Yes    | Extends HOTP implementation |
| Unix time (T0) = 0   | Yes    | Default epoch start         |
| Time step (X) = 30   | Yes    | Default, configurable       |
| SHA-1 support        | Yes    | Default algorithm           |
| SHA-256 support      | Yes    | Optional algorithm          |
| SHA-512 support      | Yes    | Optional algorithm          |
| Time drift tolerance | Yes    | Configurable window         |

### Test Vectors

otplib passes all RFC 6238 Appendix B test vectors:

| Time (sec)  | Mode | SHA    | Expected | Actual   | Status |
| ----------- | ---- | ------ | -------- | -------- | ------ |
| 59          | TOTP | SHA1   | 94287082 | 94287082 | Pass   |
| 59          | TOTP | SHA256 | 46119246 | 46119246 | Pass   |
| 59          | TOTP | SHA512 | 90693936 | 90693936 | Pass   |
| 1111111109  | TOTP | SHA1   | 07081804 | 07081804 | Pass   |
| 1111111109  | TOTP | SHA256 | 68084774 | 68084774 | Pass   |
| 1111111109  | TOTP | SHA512 | 25091201 | 25091201 | Pass   |
| 1111111111  | TOTP | SHA1   | 14050471 | 14050471 | Pass   |
| 1234567890  | TOTP | SHA1   | 89005924 | 89005924 | Pass   |
| 2000000000  | TOTP | SHA1   | 69279037 | 69279037 | Pass   |
| 20000000000 | TOTP | SHA1   | 65353130 | 65353130 | Pass   |

### Intermediate Time Step (T) Values

otplib verifies the time step calculation against the "Value of T (hex)" from RFC 6238 Appendix B. This ensures that time-to-counter conversion is accurate.

| Time (sec)  | Value of T (hex)   | Status |
| ----------- | ------------------ | ------ |
| 59          | `0000000000000001` | Pass   |
| 1111111109  | `00000000023523ec` | Pass   |
| 1111111111  | `00000000023523ed` | Pass   |
| 1234567890  | `000000000273ef07` | Pass   |
| 2000000000  | `0000000003f940aa` | Pass   |
| 20000000000 | `0000000027bc86aa` | Pass   |

## RFC 4648 - The Base16, Base32, and Base64 Data Encodings

### Key Requirements

| Requirement                 | Status      | Notes                  |
| --------------------------- | ----------- | ---------------------- |
| RFC 4648 Section 6 (Base32) | Implemented | Standard alphabet      |
| Padding character (=)       | Implemented | Optional padding       |
| Case-insensitive decoding   | Implemented | Uppercase conversion   |
| No padding for GA           | Implemented | Configurable           |
| Test vectors                | Pass        | All Section 10 vectors |

### Test Vectors

otplib passes all RFC 4648 Section 10 test vectors:

| Input      | Expected (with padding) | Expected (no padding) | Actual (with padding) | Actual (no padding) | Status |
| ---------- | ----------------------- | --------------------- | --------------------- | ------------------- | ------ |
| "" (empty) | ""                      | ""                    | ""                    | ""                  | Pass   |
| "f"        | "MY======"              | "MY"                  | "MY======"            | "MY"                | Pass   |
| "fo"       | "MZXQ===="              | "MZXQ"                | "MZXQ===="            | "MZXQ"              | Pass   |
| "foo"      | "MZXW6==="              | "MZXW6"               | "MZXW6==="            | "MZXW6"             | Pass   |
| "foob"     | "MZXW6YQ="              | "MZXW6YQ"             | "MZXW6YQ="            | "MZXW6YQ"           | Pass   |
| "fooba"    | "MZXW6YTB"              | "MZXW6YTB"            | "MZXW6YTB"            | "MZXW6YTB"          | Pass   |
| "foobar"   | "MZXW6YTBOI======"      | "MZXW6YTBOI"          | "MZXW6YTBOI======"    | "MZXW6YTBOI"        | Pass   |

## Google Authenticator Compatibility

Google Authenticator expects **no padding** and uses the standard RFC 4648 alphabet:

```typescript
// GA-compatible encoding
const secret = base32.encode(randomBytes(20), { padding: false });
// Example: "JBSWY3DPEHPK3PXP"
```

### otpauth:// URI Format

otplib fully implements the otpauth:// URI format used by Google Authenticator:

```
otpauth://TYPE/LABEL?PARAMETERS
```

**Supported Parameters:**

| Parameter | Required       | Type   | Description           | Default |
| --------- | -------------- | ------ | --------------------- | ------- |
| secret    | Yes            | string | Base32-encoded secret | -       |
| issuer    | Recommended    | string | Provider name         | -       |
| algorithm | No             | string | Hash algorithm        | SHA1    |
| digits    | No             | number | OTP length            | 6       |
| counter   | No (HOTP only) | number | Initial counter       | 0       |
| period    | No (TOTP only) | number | Time step in seconds  | 30      |

### URI Generation

```typescript
import { generateURI } from "otplib";
import { NodeCryptoPlugin } from "@otplib/plugin-crypto-node";
import { ScureBase32Plugin } from "@otplib/plugin-base32-scure";

const crypto = new NodeCryptoPlugin();
const base32 = new ScureBase32Plugin();

const uri = generateURI({
  issuer: "MyService",
  label: "user@example.com",
  secret: "JBSWY3DPEHPK3PXP",
  algorithm: "sha1",
  digits: 6,
  period: 30,
  crypto,
  base32,
});
// otpauth://totp/MyService:user@example.com?secret=...&issuer=MyService&algorithm=SHA1&digits=6&period=30
```

### Test Integration

1. Generate secret and URI in your app
2. Display QR code from URI
3. Scan with Google Authenticator
4. Verify tokens generated by app

## Security Considerations

### RFC 4226 Section 7.3 - Throttling

**Recommendation:** Implement exponential backoff after failed attempts.

```typescript
// Example rate limiting strategy
const MAX_ATTEMPTS = 3;
const LOCKOUT_DURATION = 30 * 60; // 30 minutes

function checkRateLimit(userId: string): boolean {
  const attempts = getFailedAttempts(userId);
  if (attempts >= MAX_ATTEMPTS) {
    const lockoutEnd = getLockoutEndTime(userId);
    if (Date.now() < lockoutEnd) {
      return false; // Locked out
    }
  }
  return true;
}
```

### RFC 6238 Section 5.2 - Tolerance

**Recommendation:** Use smallest tolerance that provides good UX.

```typescript
// RFC-compliant (past only, for transmission delay)
epochTolerance: [5, 0];

// Standard (allow ±30 seconds)
epochTolerance: 30;

// Strict (current period only)
epochTolerance: 0;
```

### Timing Attack Prevention

otplib uses constant-time comparison for all token verifications:

```typescript
function constantTimeEqual(a: string | Uint8Array, b: string | Uint8Array): boolean {
  const bufA = typeof a === "string" ? new TextEncoder().encode(a) : a;
  const bufB = typeof b === "string" ? new TextEncoder().encode(b) : b;

  if (bufA.length !== bufB.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < bufA.length; i++) {
    result |= bufA[i] ^ bufB[i];
  }

  return result === 0;
}
```

## Compliance Testing

All RFC compliance is verified through automated tests, see the [test-vectors.ts](https://github.com/yeojz/otplib/blob/main/tests/shared/test-vectors.ts) file for more details.

## References

- [RFC 4226 - HOTP](https://datatracker.ietf.org/doc/html/rfc4226)
- [RFC 6238 - TOTP](https://datatracker.ietf.org/doc/html/rfc6238)
- [RFC 4648 - Base32](https://datatracker.ietf.org/doc/html/rfc4648)
- [Google Authenticator Spec](https://github.com/google/google-authenticator/wiki/Key-Uri-Format)
