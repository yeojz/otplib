# otplib packages

This library adopts a monorepo design, and is responsible for `@otplib/*` packages.
The only other package that is not under this scope is the quick-start package `otplib`.
All other `otplib-*` libraries that are not scoped are not maintained under this project.

Packages are classified into 3 categories: `core`, `plugin` and `preset`.

<!-- TOC depthFrom:2 -->

- [Core](#core)
- [Plugins](#plugins)
  - [Plugins - Crypto](#plugins---crypto)
  - [Plugins - Base32](#plugins---base32)
- [Presets](#presets)

<!-- /TOC -->

## Core

Provides the core functionality of the library. Parts of the logic
has been separated out in order to provide flexibility to the library via
available plugins.

| npm install        | description                                          |
| ------------------ | ---------------------------------------------------- |
| @otplib/core       | Core hotp/totp/authenticator functions + classes     |
| @otplib/core-async | Provides async helpers in addition to `@otplib/core` |

```js
import { HOTP, TOTP, Authenticator } from '@otplib/core';
import { HOTPAsync, TOTPAsync, AuthenticatorAsync } from '@otplib/core-async';
```

## Plugins

### Plugins - Crypto

| npm install                         | type  | uses                           |
| ----------------------------------- | ----- | ------------------------------ |
| @otplib/plugin-crypto               | sync  | `crypto` (included in Node.js) |
| @otplib/plugin-crypto-js            | sync  | `crypto-js`                    |
| @otplib/plugin-crypto-async-ronomon | async | `@ronomon/crypto-async`        |

These crypto plugins provides:

```js
{
  createDigest, // used for token derivation
  createRandomBytes, //used to generate random keys for Google Authenticator
}
```

### Plugins - Base32

| npm install                   | type | uses                                |
| ----------------------------- | ---- | ----------------------------------- |
| @otplib/plugin-thirty-two     | sync | `thirty-two`                        |
| @otplib/plugin-base32-enc-dec | sync | `base32-encode` and `base32-decode` |

These Base32 plugins provides:

```js
{
  keyDecoder, //for decoding Google Authenticator secrets
  keyEncoder, // for encoding Google Authenticator secrets.
}
```

## Presets

Presets are preconfigured HOTP, TOTP, Authenticator instances to
allow you to get started with the library quickly.

Each presets would need the corresponding dependent npm modules to be installed.

| npm install                  | description                                                                                        |
| ---------------------------- | -------------------------------------------------------------------------------------------------- |
| @otplib/preset-default       | A preset with the base32 and crypto plugins already setup.                                         |
| @otplib/preset-default-async | Async version of `@otplib/preset-default`                                                          |
| @otplib/preset-browser       | Webpack bundle and is self contained.<br /> [See Browser Compatibility][docs-browser-compatiblity] |
| @otplib/preset-v11           | Wrapper to adapt the APIs to v11.x compatible format                                               |

[docs-browser-compatiblity]: https://github.com/yeojz/otplib/blob/master/README.md#browser-compatiblity
