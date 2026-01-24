# Security Best Practices

Guidelines for securely implementing OTP-based authentication with otplib.

## Secret Generation

Always use cryptographically secure random number generation. `otplib`'s `generateSecret` uses a CSPRNG (Cryptographically Secure Pseudo-Random Number Generator) internally.

```typescript
// UNSAFE: Predictable values
const secret = "AAAAAAAAAAAAAAAA";
const secret = "user123secret";

// UNSAFE: Weak random sources
const secret = Math.random().toString(36);
const secret = Date.now().toString();
```

## Token Verification

### Constant-Time Comparison

`otplib` uses constant-time comparison internally to prevent timing attacks.

```typescript
// UNSAFE: Vulnerable to timing attacks
if (generatedToken === userToken) {
  // ...
}
```

### Rate Limiting

This library does not implement rate limiting and is focus on providing OTP functionality.
Do implement rate limiting in your application to prevent brute-force attacks.

### Replay Attack Prevention

otplib is a **stateless** library. It does not track which tokens have already been verified.

:::info HOTP

Always increment the counter after successful verification.
See the [Replay Protection (HOTP)](advanced-usage.md#replay-protection-hotp) guide for examples.

:::

:::info TOTP

Consider implementing stateful tracking in your application database or cache to prevent replay attacks.
Without this, a valid token can be reused multiple times within its validity window.
See the [Replay Protection](advanced-usage.md#replay-protection-totp) guide for implementation details and examples.

:::

## Other Common Vulnerabilities

### Secret Exposure in Logs

```typescript
// UNSAFE: Exposes secret in logs
console.log("Verifying token for secret:", secret);
```

### Large Verification Windows

```typescript
// UNSAFE: Large verification windows allow replay attacks
const result = await verify({ secret, token, epochTolerance: 300 });
```

```typescript
// SAFER: Small verification windows prevent replay attacks
const result = await verify({ secret, token, epochTolerance: 30 });
```

## Further Reading

- [RFC 4226](https://tools.ietf.org/html/rfc4226) - HOTP Algorithm
- [RFC 6238](https://tools.ietf.org/html/rfc6238) - TOTP Algorithm
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [NIST Digital Identity Guidelines](https://pages.nist.gov/800-63-3/)
