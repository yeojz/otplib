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

### Why Override Guardrails?

Valid reasons to customize guardrails:

1. **Legacy System Integration**: Existing systems using non-standard parameters
2. **Regulatory Requirements**: Industry-specific compliance needs
3. **Specialized Hardware**: Devices with unique constraints
4. **Testing**: Controlled test environments requiring extreme values

### How to Override Guardrails

The `createGuardrails()` factory is provided to allow you to override the default guardrails. It returns a frozen (immutable) guardrails object.

```typescript
import { createGuardrails } from "@otplib/core";

// Returns a frozen (immutable) guardrails object
const guardrails = createGuardrails({
  MIN_SECRET_BYTES: 10,
  MAX_WINDOW: 20,
});

// Attempting to modify throws an error
guardrails.MAX_WINDOW = 30; // TypeError: Cannot assign to read only property
```

You only need to specify the guardrails you want to override. Unspecified limits use their defaults.

::: warning
There is NO validation performed on the guardrails that are set this way. It is up to the developer to ensure that the guardrails are valid.

For example, setting `MIN_SECRET_BYTES` to a value higher than `MAX_SECRET_BYTES` might result in unexpected behavior.
:::

### Overridable Guardrails

| Setting              | Default               | Risk                                                                                              | When to modify                                                                        |
| :------------------- | :-------------------- | :------------------------------------------------------------------------------------------------ | :------------------------------------------------------------------------------------ |
| **MIN_SECRET_BYTES** | 16 bytes (128 bits)   | Secrets become vulnerable to brute-force attacks. A 10-byte secret has only 2^80 possible values. | Only when integrating with legacy systems that cannot be upgraded.                    |
| **MAX_SECRET_BYTES** | 1024 bytes            | Potential DoS attacks through excessive memory consumption.                                       | Rarely needed. Standard secrets are 20-32 bytes.                                      |
| **MIN_PERIOD**       | 1 second              | Below 1 second, TOTP, behaviour will become unpredicatable.                                       | Use HOTP instead if you need event-based OTPs.                                        |
| **MAX_PERIOD**       | 3600 seconds (1 hour) | Tokens remain valid longer, increasing replay attack window.                                      | Specialized systems with coarse time granularity (e.g., daily batch processes).       |
| **MAX_WINDOW**       | 99 total checks       | Larger verification windows increase replay attack surface exponentially.                         | Systems with extreme desynchronization. Consider fixing the underlying issue instead. |

### Usage Examples

#### Functional API

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

#### Class-Based API

##### Instance-Level Guardrails

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
  secret: "GEZDGNBVGY3TQOJQGEZDGNBVGY",
  crypto: new NodeCryptoPlugin(),
  base32: new ScureBase32Plugin(),
  guardrails: customGuardrails,
});

// All generate/verify calls use the instance guardrails
const token = await hotp.generate(0);
const result = await hotp.verify({ token, counter: 0 });
```

##### Method-Level Overrides

```typescript
import { HOTP, createGuardrails } from "@otplib/hotp";
import { NodeCryptoPlugin } from "@otplib/plugin-crypto-node";
import { ScureBase32Plugin } from "@otplib/plugin-base32-scure";

// Instance with standard guardrails
const hotp = new HOTP({
  secret: "GEZDGNBVGY3TQOJQGEZDGNBVGY",
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

### Counter Tolerance Semantics

HOTP counter tolerance supports two formats for fine-grained control:

**Number format** (look-ahead only, secure default):

```typescript
counterTolerance: 5; // Checks current + 5 future counters [0, 5]
```

**Tuple format** (explicit control):

```typescript
counterTolerance: [5, 5]; // Symmetric: ±5 counters
counterTolerance: [0, 10]; // Look-ahead only: 10 future counters
counterTolerance: [10, 5]; // Asymmetric: 10 past, 5 future
```

::: tip Security Note
The default number format creates a look-ahead only window `[0, n]`, which prevents replay attacks by not checking past counters. Use tuple format `[n, n]` only if you need symmetric behavior for specific integration requirements.
:::

##### TOTP Example

```typescript
import { TOTP, createGuardrails } from "@otplib/totp";
import { NodeCryptoPlugin } from "@otplib/plugin-crypto-node";
import { ScureBase32Plugin } from "@otplib/plugin-base32-scure";

const totp = new TOTP({
  secret: "GEZDGNBVGY3TQOJQGEZDGNBVGY",
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

## Related Documentation

- [Security Best Practices](./security.md) - General security guidelines
- [Advanced Usage](./advanced-usage.md) - Advanced configuration options
- [RFC Implementations](./rfc-implementations.md) - Standards compliance
