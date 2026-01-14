# TOTP Replay Protection Design

**Feature**: Add `afterTimeStep` parameter to TOTP verification for replay attack prevention

**Status**: Design approved

**Date**: 2026-01-14

## Overview

Add replay attack protection for TOTP by allowing applications to specify a minimum valid time step. Once a TOTP code from a given time step is successfully verified, that time step (and all earlier ones) can be permanently rejected in subsequent verifications.

### Use Case

Applications can track the `timeStep` from each successful verification and pass it as `afterTimeStep` in subsequent verifications. This prevents the same TOTP code from being used twice.

### Example Flow

```typescript
// First verification
const result1 = totp.verify({ token: "123456", secret: "..." });
// result1 = { valid: true, delta: 0, timeStep: 41152263 }
await saveLastTimeStep(result1.timeStep);

// Subsequent verification - rejects codes from time step 41152263 and earlier
const lastTimeStep = await getLastTimeStep();
const result2 = totp.verify({
  token: "789012",
  secret: "...",
  afterTimeStep: lastTimeStep, // Reject timeStep <= 41152263
});
```

## API Design

### New Parameter: `afterTimeStep`

- **Type**: `number` (integer)
- **Default**: `undefined` (no constraint)
- **Added to**: `totp.verify()` and `totp.verifySync()`
- **Ignored in**: `totp.generate()` (verification-only feature)
- **Semantics**: Exclusive lower bound for valid time steps
  - Rejects any time step where `timeStep <= afterTimeStep`
  - Allows time steps where `timeStep > afterTimeStep`

### Return Value Change

All successful TOTP verifications now include the `timeStep` property:

```typescript
// Before
{ valid: true, delta: 0 }

// After (non-breaking, additive)
{ valid: true, delta: 0, timeStep: 41152263 }
```

The `timeStep` is the actual time step number (per RFC 6238) used for verification, not a Unix timestamp.

### Example Usage

```typescript
// Current time step: 41152263, window: 1
totp.verify({
  token,
  secret,
  afterTimeStep: 41152262, // Rejects 41152262 and earlier
  // Allows 41152263, 41152264
});
```

## Validation Rules

### Validation Errors (Throw Immediately)

1. **Negative values**
   - Error: `"afterTimeStep must be >= 0"`
   - Example: `afterTimeStep: -1`

2. **Non-integer values**
   - Error: `"Invalid afterTimeStep: non-integer value"`
   - Examples: `afterTimeStep: 41152263.5`, `afterTimeStep: 41152263.0`

3. **Impossible constraint**
   - Error: `"Invalid afterTimeStep: cannot be greater than current time step plus window"`
   - Example: `afterTimeStep: 41152270` when current is `41152263` with `window: 1`

### Accepted Values

- `afterTimeStep: 0` or very old values (no effective restriction)
- Valid integers within reasonable range

### Semantics

- `afterTimeStep` is an **exclusive lower bound**: rejects time steps `<= afterTimeStep`
- Comparison: `timeStep > afterTimeStep` (strictly greater than)
- Applies to entire time step window (not individual timestamps)

## Implementation Approach

### Location

Modify core TOTP verification loop in `@otplib/totp` package.

### Verification Loop Order

1. Calculate time step from current time (or provided `epoch` option)
2. **Check `afterTimeStep` constraint** → reject if `timeStep <= afterTimeStep`
3. Check if time step is within `window`
4. Generate HOTP for the time step
5. Compare with provided token

### Optimization

Early rejection at step 2 provides:

- Skip expensive HOTP generation for invalid time steps
- No HMAC calculations for rejected epochs
- Minimal performance impact when `afterTimeStep` is not provided

### Scope of Changes

- `totp.verify()` - add `afterTimeStep` parameter, validation, and constraint check
- `totp.verifySync()` - identical changes
- `totp.generate()` - no changes (parameter ignored if passed)
- Return type - add `timeStep: number` to success object
- No changes to HOTP or other packages

### TypeScript Changes

```typescript
interface TOTPVerifyOptions {
  // ... existing options
  afterTimeStep?: number;
}

interface TOTPVerifyResult {
  valid: boolean;
  delta?: number;
  timeStep: number; // Always included on success
}
```

## Testing Strategy

### Required Test Suites

1. **Core functionality**
   - Success: Code from time step > `afterTimeStep` verifies successfully
   - Rejection: Code from time step <= `afterTimeStep` fails verification
   - Return value: Successful verification includes correct `timeStep`

2. **Edge cases**
   - `afterTimeStep` equals current time step (rejects current, allows future)
   - `afterTimeStep` at window boundary with `window: 1`
   - `afterTimeStep = 0` (no effective restriction)
   - Large `window` combined with `afterTimeStep` constraint
   - Verification with default options works unchanged (backward compatibility)

3. **Validation errors**
   - Negative `afterTimeStep` throws with correct error message
   - Non-integer `afterTimeStep` throws (both `.5` and `.0` cases)
   - `afterTimeStep > currentTimeStep + window` throws

### Good-to-Have Tests

- Property-based testing with fast-check for randomized scenarios
- Integration tests showing full "verify → save → verify with constraint" flow
- Concurrent verification scenarios

### Coverage

- Maintain existing coverage thresholds
- New code paths should have 100% coverage

## Documentation & Migration

### Migration Impact

**Non-breaking change**: Adding `timeStep` to return value is purely additive. No migration guide needed. Existing code continues to work unchanged.

### Required Documentation

1. **API reference**
   - Document `afterTimeStep` parameter in `totp.verify()` and `totp.verifySync()`
   - Type: `number` (integer), optional
   - Semantics: exclusive lower bound for valid time steps
   - Validation: throws if negative, non-integer, or impossible

2. **Return value**
   - Document `timeStep` property in success object
   - Explain it's the actual time step used for verification
   - Note: always included in successful verifications

3. **Usage guide**
   - Add section on replay attack prevention
   - Show pattern: verify → save `timeStep` → next verify with `afterTimeStep`
   - Example with realistic state management (database, session, etc.)

4. **Security considerations**
   - Explain that state management is application's responsibility
   - Note that `afterTimeStep` doesn't prevent concurrent verification race conditions
   - Clarify that clock synchronization is important for correct behavior

### Example Code

```typescript
// Basic usage
const result = totp.verify({ token, secret, afterTimeStep: lastTimeStep });
if (result.valid) {
  await updateLastTimeStep(result.timeStep);
}

// With async state management
async function login(token: string) {
  const lastTimeStep = await db.getLastTimeStep(userId);
  const result = totp.verify({
    token,
    secret: userSecret,
    afterTimeStep: lastTimeStep,
  });

  if (result.valid) {
    await db.saveLastTimeStep(userId, result.timeStep);
    return { success: true };
  }

  return { success: false };
}
```

## Terminology

Per **RFC 6238**:

- **Time step (X)**: Time step size in seconds (default: 30)
- **Time step number (T)**: Integer representing the number of time steps since Unix epoch
  - Calculated as: `T = floor((CurrentUnixTime - T0) / X)`
  - This is what `afterTimeStep` represents

## Key Decisions

1. **TOTP-only**: HOTP already has implicit protection via counter increment
2. **Named `afterTimeStep`**: Consistent with RFC 6238 terminology
3. **Throw immediately**: On impossible configuration (fail fast for development)
4. **State management**: Application's responsibility (library provides tool, not persistence)
5. **Consistent API**: Both `verify()` and `verifySync()` use `afterTimeStep`
6. **Early rejection**: Check constraint before expensive HOTP calculations

## Design Rationale

### Why `afterTimeStep` instead of `minTime`?

The existing `epoch` option in TOTP is a Unix timestamp (currentTime). Using `afterTimeStep` for the time step number (per RFC 6238) avoids confusion. The parameter name clearly indicates it's a time step count, not a timestamp.

### Why throw on impossible constraints?

Fail-fast behavior makes configuration errors obvious during development rather than silently failing in production. If `afterTimeStep` makes verification impossible, it's likely a bug in the application's state management.

### Why is state management the application's responsibility?

The library provides the verification mechanism, but persistence strategies vary widely (in-memory, database, session, cache, etc.). Keeping state management separate keeps the library flexible and simple. Applications can implement their own concurrency control, transactions, and persistence strategies.

### Why not add to HOTP?

HOTP already requires explicit counter management. After successful verification, the application increments the counter. Replaying with an old counter naturally fails since the server expects the next counter value. No additional protection needed.
