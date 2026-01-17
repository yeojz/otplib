---
"@otplib/core": minor
"@otplib/hotp": minor
"otplib": minor
---

Add tuple semantics for counterTolerance to support configurable look-ahead windows. The default `[lookAhead, lookBehind]` provides backward compatibility while allowing explicit window control. Performance optimization for HOTP verification loop to skip negative counters. Includes validation updates and documentation for MAX_WINDOW behavior.
