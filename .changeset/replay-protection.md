---
"@otplib/core": minor
"@otplib/totp": minor
---

Add `afterTimeStep` parameter to TOTP verification for replay attack prevention. Add `timeStep` to successful verification results. Includes new error types (AfterTimeStepNegativeError, AfterTimeStepNotIntegerError, AfterTimeStepImpossibleError) and comprehensive documentation.
