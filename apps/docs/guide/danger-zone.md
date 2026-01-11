# Danger Zone

::: danger Caution!
This guide covers advanced configurations that have implications on security or reliability.

For standard use cases, the defaults should be sufficient.
:::

## Guardrails

::: warning
Only modify guardrails if you have specific requirements and understand the security implications.
:::

Guardrails are validation limits that protect against common security vulnerabilities and implementation errors:

- **Prevent weak secrets** that can be brute-forced
- **Limit verification windows** to reduce replay attack surface
- **Reject extreme values** that indicate bugs or attacks

By default, otplib enforces sensible limits based on RFC recommendations and security best practices. However, some production systems may have legitimate needs to override these limits.

## Default Guardrails

```typescript
const DEFAULT_GUARDRAILS = {
  // Secret must be at least 16 bytes (128 bits)
  MIN_SECRET_BYTES: 16,

  // Secret cannot exceed 1024 bytes
  MAX_SECRET_BYTES: 1024,

  // Counter must be >= 0
  MIN_COUNTER: 0,

  // Counter cannot exceed 2^53-1 (JavaScript safe integer limit)
  MAX_COUNTER: Number.MAX_SAFE_INTEGER,

  // Time period must be at least 1 second
  MIN_PERIOD: 1,

  // Time period cannot exceed 3600 seconds (1 hour)
  MAX_PERIOD: 3600,

  // Verification window cannot exceed 10 positions in either direction
  // (For HOTP: 10 counter steps, for TOTP: 10 time periods)
  MAX_WINDOW: 10,
};
```

## Why Override Guardrails?

Valid reasons to customize guardrails:

1. **Legacy System Integration**: Existing systems using non-standard parameters
2. **Regulatory Requirements**: Industry-specific compliance needs
3. **Specialized Hardware**: Devices with unique constraints
4. **Testing**: Controlled test environments requiring extreme values

## Security Implications

### MIN_SECRET_BYTES

**Default**: 16 bytes (128 bits)

**Risk of lowering**: Secrets become vulnerable to brute-force attacks. A 10-byte secret has only 2^80 possible values, which is feasible for well-funded attackers.

```typescript
// UNSAFE: Weak 8-byte secret
const guardrails = createGuardrails({ MIN_SECRET_BYTES: 8 });
```

**When to lower**: Only when integrating with legacy systems that cannot be upgraded.

### MAX_SECRET_BYTES

**Default**: 1024 bytes

**Risk of increasing**: Potential DoS attacks through excessive memory consumption.

```typescript
// UNSAFE: Allows 10MB secrets
const guardrails = createGuardrails({ MAX_SECRET_BYTES: 10000000 });
```

**When to increase**: Rarely needed. Standard secrets are 20-32 bytes.

### MIN_PERIOD

**Default**: 1 second

**Risk of lowering**: Below 1 second, TOTP becomes impractical due to clock drift and network latency.

**When to lower**: Never. Use HOTP instead if you need event-based OTPs.

### MAX_PERIOD

**Default**: 3600 seconds (1 hour)

**Risk of increasing**: Tokens remain valid longer, increasing replay attack window.

```typescript
// UNSAFE: Tokens valid for 24 hours
const guardrails = createGuardrails({ MAX_PERIOD: 86400 });
```

**When to increase**: Specialized systems with coarse time granularity (e.g., daily batch processes).

### MAX_WINDOW

**Default**: 10 positions

**Risk of increasing**: Larger verification windows increase replay attack surface exponentially.

```typescript
// UNSAFE: Checks 101 positions (50 before, current, 50 after)
const guardrails = createGuardrails({ MAX_WINDOW: 50 });
```

**When to increase**: Systems with extreme clock drift or poor network conditions. Consider fixing the underlying issue instead.

## Usage Examples

### Functional API

```typescript
import { generate, verify, createGuardrails } from "@otplib/hotp";
import { NodeCryptoPlugin } from "@otplib/plugin-crypto-node";

// Create custom guardrails
const customGuardrails = createGuardrails({
  MIN_SECRET_BYTES: 10, // Lower limit for legacy system
  MAX_WINDOW: 20, // Larger window for poor network
});

// Pass to generate/verify functions
const token = await generate({
  secret: mySecret,
  counter: 0,
  crypto: new NodeCryptoPlugin(),
  guardrails: customGuardrails,
});

const result = await verify({
  secret: mySecret,
  token,
  counter: 0,
  counterTolerance: 15,
  crypto: new NodeCryptoPlugin(),
  guardrails: customGuardrails,
});
```

### Class-Based API

#### Instance-Level Guardrails

```typescript
import { HOTP, createGuardrails } from "@otplib/hotp";
import { NodeCryptoPlugin } from "@otplib/plugin-crypto-node";
import { ScureBase32Plugin } from "@otplib/plugin-base32-scure";

// Create custom guardrails using the factory function
const customGuardrails = createGuardrails({
  MAX_WINDOW: 20,
});

// Configure guardrails for all operations on this instance
const hotp = new HOTP({
  secret: "JBSWY3DPEHPK3PXP",
  crypto: new NodeCryptoPlugin(),
  base32: new ScureBase32Plugin(),
  guardrails: customGuardrails,
});

// All generate/verify calls use the instance guardrails
const token = await hotp.generate(0);
const result = await hotp.verify({ token, counter: 0 });
```

#### Method-Level Overrides

```typescript
import { HOTP, createGuardrails } from "@otplib/hotp";
import { NodeCryptoPlugin } from "@otplib/plugin-crypto-node";
import { ScureBase32Plugin } from "@otplib/plugin-base32-scure";

// Instance with standard guardrails
const hotp = new HOTP({
  secret: "JBSWY3DPEHPK3PXP",
  crypto: new NodeCryptoPlugin(),
  base32: new ScureBase32Plugin(),
});

// Override guardrails for a specific operation
const token = await hotp.generate(0, {
  guardrails: createGuardrails({ MIN_SECRET_BYTES: 10 }),
});

// Verification with different override
const result = await hotp.verify(
  { token, counter: 0 },
  {
    counterTolerance: 15,
    guardrails: createGuardrails({ MAX_WINDOW: 20 }),
  },
);
```

### TOTP Example

```typescript
import { TOTP, createGuardrails } from "@otplib/totp";
import { NodeCryptoPlugin } from "@otplib/plugin-crypto-node";
import { ScureBase32Plugin } from "@otplib/plugin-base32-scure";

const totp = new TOTP({
  secret: "JBSWY3DPEHPK3PXP",
  period: 60, // 60-second periods
  crypto: new NodeCryptoPlugin(),
  base32: new ScureBase32Plugin(),
  guardrails: createGuardrails({
    MAX_PERIOD: 120, // Allow up to 2-minute periods
    MAX_WINDOW: 5, // Tighter window than default
  }),
});

const token = await totp.generate();
const result = await totp.verify(token, { epochTolerance: 30 });
```

## Partial Overrides

You only need to specify the guardrails you want to override. Unspecified limits use their defaults:

```typescript
// Only override MAX_WINDOW, everything else uses defaults
const guardrails = createGuardrails({
  MAX_WINDOW: 20,
});
```

## Testing Considerations

For testing, you might need extreme values:

```typescript
import { createGuardrails } from "@otplib/core";

// Testing guardrails (NEVER use in production)
const testGuardrails = createGuardrails({
  MIN_SECRET_BYTES: 1, // Allow tiny secrets for unit tests
  MAX_WINDOW: 1000, // Large window for edge case testing
  MAX_PERIOD: 86400, // Allow daily periods
});
```

::: warning
Always use separate configurations for testing and production. Never deploy test guardrails to production.
:::

## Validation Errors

If your values violate guardrails, you'll receive clear error messages:

```typescript
// With default guardrails
const token = await generate({
  secret: tooShortSecret, // 8 bytes
  counter: 0,
  crypto: new NodeCryptoPlugin(),
});
// Throws: SecretTooShortError: Secret must be at least 16 bytes

// With custom guardrails
const customGuardrails = createGuardrails({ MIN_SECRET_BYTES: 8 });
const token = await generate({
  secret: tooShortSecret, // 8 bytes - now acceptable
  counter: 0,
  crypto: new NodeCryptoPlugin(),
  guardrails: customGuardrails,
});
// Success
```

## Factory Pattern

The `createGuardrails()` factory ensures guardrails are immutable and properly validated:

```typescript
import { createGuardrails } from "@otplib/core";

// Returns a frozen (immutable) guardrails object
const guardrails = createGuardrails({ MAX_WINDOW: 20 });

// Attempting to modify throws an error
guardrails.MAX_WINDOW = 30; // TypeError: Cannot assign to read only property
```

## Related Documentation

- [Security Best Practices](./security.md) - General security guidelines
- [Advanced Usage](./advanced-usage.md) - Advanced configuration options
- [RFC Implementations](./rfc-implementations.md) - Standards compliance
