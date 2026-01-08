# Security Best Practices

Guidelines for securely implementing OTP-based authentication with otplib.

## Secret Management

### Generation

Always use cryptographically secure random number generation. `otplib`'s `generateSecret` uses a CSPRNG (Cryptographically Secure Pseudo-Random Number Generator) internally.

::: danger Insecure Patterns

```typescript
// NEVER use predictable values
const secret = "AAAAAAAAAAAAAAAA";
const secret = "user123secret";

// NEVER use weak random sources
const secret = Math.random().toString(36);
const secret = Date.now().toString();
```

:::

### Storage

**Server-side:**

- Encrypt secrets at rest using AES-256 or similar
- Use a dedicated secrets manager (AWS Secrets Manager, HashiCorp Vault)
- Never log secrets, even in debug mode
- Implement proper access controls

**Client-side:**

- Store in secure enclaves when available (Keychain, Keystore)
- Never store in localStorage, sessionStorage, or cookies
- Clear from memory after use

### Transmission

- Always use HTTPS/TLS for secret transmission
- Use secure key exchange for initial secret provisioning
- Consider end-to-end encryption for sensitive deployments

## JavaScript Memory Limitations

::: warning High-Security Environments
JavaScript does not provide mechanisms for explicit memory clearing like `memset_s` in C or `SecureString` in .NET. This limitation affects all JavaScript OTP libraries, not just otplib.
:::

### The Issue

When secrets are stored in JavaScript strings or Uint8Arrays, they remain in memory until the garbage collector reclaims them. This creates a window where:

1. **Secrets persist in memory** after they're no longer needed
2. **Memory dumps** (crash dumps, core dumps) may contain secrets
3. **Heap inspection** by malicious code could expose secrets

### Mitigation Strategies

**For standard deployments**, JavaScript's memory model is acceptable because:

- Secrets have short exposure windows (authentication flow duration)
- Modern JavaScript engines have efficient garbage collection
- The attack surface for memory inspection is limited

## Token Verification

### Constant-Time Comparison

`otplib` uses constant-time comparison internally to prevent timing attacks.

::: warning Never Do This

```typescript
// UNSAFE: Vulnerable to timing attacks
if (generatedToken === userToken) {
  // ...
}
```

:::

### Rate Limiting

Implement rate limiting to prevent brute-force attacks. An attacker should not be able to guess the token by trying all 1,000,000 combinations.

### Replay Attack Prevention

::: warning Stateless Library
otplib is a **stateless** library. It does not (and cannot) track which tokens have already been verified.

You **MUST** implement stateful tracking in your application database or cache to prevent replay attacks. Without this, a valid token can be reused multiple times within its validity window.
:::

- **For HOTP:** Always increment the counter after successful verification.
- **For TOTP:** Track used tokens within the current window.

## Algorithm Selection

### SHA-1 vs SHA-256 vs SHA-512

| Algorithm | Security          | Compatibility | Recommendation          |
| --------- | ----------------- | ------------- | ----------------------- |
| SHA-1     | Adequate for HMAC | Universal     | Default choice          |
| SHA-256   | Better margin     | Good          | Compliance requirements |
| SHA-512   | Best margin       | Limited       | High-security systems   |

::: info Why SHA-1 is Still Acceptable
While SHA-1 has known collision vulnerabilities, HMAC-SHA-1 remains secure. The attack surface for OTP (6-8 digits, short validity) makes collision attacks impractical. SHA-1 provides the best compatibility with authenticator apps.
:::

## Other Common Vulnerabilities

### Secret Exposure in Logs

**Vulnerable:**

```typescript
console.log("Verifying token for secret:", secret);
```

**Secure:**

```typescript
console.log("Verifying token for user:", userId);
```

### No Rate Limiting

Do ensure rate limiting is implemented in your application. This library only provides the core OTP logic and does not provide rate limiting out of the box.

### Large Verification Windows

**Vulnerable:**

```typescript
const result = await verify({ secret, token, epochTolerance: 300 });
```

**Secure:**

```typescript
const result = await verify({ secret, token, epochTolerance: 30 });
```

### No Replay Protection

Especially critical for HOTP, update your counter after successful verification. For TOTP, you can consider tracking used tokens within the current window.

**Vulnerable:**

```typescript
// HOTP without counter update
if (result.valid) {
  grantAccess();
  // Counter not updated - same token works again!
}
```

**Secure:**

```typescript
if (result.valid) {
  await updateCounter(userId, counter + result.delta + 1);
  grantAccess();
}
```

## Further Reading

- [RFC 4226](https://tools.ietf.org/html/rfc4226) - HOTP Algorithm
- [RFC 6238](https://tools.ietf.org/html/rfc6238) - TOTP Algorithm
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [NIST Digital Identity Guidelines](https://pages.nist.gov/800-63-3/)
