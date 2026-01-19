# Security Policy

## Supported Versions

| Version | Status  |
| ------- | ------- |
| 13.x    | Current |
| <= 12.x | EoL     |

## Reporting a Vulnerability

If you discover a security vulnerability:

1. **Do NOT open a public issue**
2. Use [GitHub's private security advisory](https://github.com/yeojz/otplib/security/advisories/new) to report the vulnerability
3. Include steps to reproduce, impact assessment, and any suggested fixes

You can expect an initial response within 72 hours. We will work with you to understand the issue and coordinate disclosure.

## Security Scope

This library implements RFC 4226 (HOTP) and RFC 6238 (TOTP) with the following security measures:

- Constant-time token comparison (timing attack prevention)
- DoS prevention guardrails (bounded verification windows, secret size limits)
- Cryptographically secure random number generation for secrets
- Replay protection via `afterTimeStep` parameter

### Out of Scope

The following are the responsibility of the application using this library:

- Secure storage of secrets (use encrypted storage, HSMs, or secure enclaves)
- Rate limiting authentication attempts
- Account lockout policies
- Secure transmission (HTTPS)
- Session management after successful verification
