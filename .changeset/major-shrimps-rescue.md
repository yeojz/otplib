---
"otplib": patch
"@otplib/preset-v11": patch
"@otplib/v12-adapter": patch
---

Use pre-instantiated frozen plugin singletons from plugin packages instead of creating new instances. This reduces memory overhead and ensures all consumers use the same immutable plugin instances.
