---
"@otplib/core": minor
"@otplib/hotp": minor
"otplib": minor
---

Add tuple semantics for counterTolerance (`[past, future]`) to support configurable verification windows. A number `n` now creates look-ahead only `[0, n]` for improved security. Performance optimization for HOTP verification loop to skip negative counters. Change MAX_WINDOW from 100 to 99 for equal distribution of past/future tolerance plus current counter.
