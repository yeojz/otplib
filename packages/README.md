# otplib packages

This library adopts a monorepo design. It contains both scoped (`@otplib/*`) and unscoped
npm packages, all of which are listed in this document.
Only packages found in this repository are officially supported under this project.

The codebase was split out into multiple packages (as plugins) in order to guard against any
possible deprecations of 3rd-party dependencies or new platforms which require unique implementations.

Do refer to the [Quick Start Guide][docs-quick-start] to get started.

<!-- TOC depthFrom:2 -->

- [Unscoped Packages](#unscoped-packages)
- [Scoped Packages](#scoped-packages)
  - [Core](#core)
  - [Plugins](#plugins)
    - [Plugins - Crypto](#plugins---crypto)
    - [Plugins - Base32](#plugins---base32)
  - [Presets](#presets)

<!-- /TOC -->

## Unscoped Packages

These are usually quick start packages or feature packages that installs and uses
one or many of the `@otplib/*` scoped packages.

| npm install        | description                               |
| ------------------ | ----------------------------------------- |
| [otplib](./otplib) | Main package for quickly getting started. |

## Scoped Packages

These packages are published under the `@otplib/*` namespace.

Packages are for scoped modules fall into 3 categories: `core`, `plugins` and `presets`.

### Core

Provides the core functionality of the library. Parts of the logic
has been separated out in order to provide flexibility to the library via
available plugins.

| npm install                               | description                                          |
| ----------------------------------------- | ---------------------------------------------------- |
| [@otplib/core](./otplib-core)             | Core hotp/totp/authenticator functions + classes     |
| [@otplib/core-async](./otplib-core-async) | Provides async helpers in addition to `@otplib/core` |

```js
import { HOTP, TOTP, Authenticator } from '@otplib/core';
import { HOTPAsync, TOTPAsync, AuthenticatorAsync } from '@otplib/core-async';
```

### Plugins

#### Plugins - Crypto

| npm install                                                                 | type  | uses                           |
| --------------------------------------------------------------------------- | ----- | ------------------------------ |
| [@otplib/plugin-crypto](./otplib-plugin-crypto)                             | sync  | `crypto` (included in Node.js) |
| [@otplib/plugin-crypto-js](./otplib-plugin-crypto-js)                       | sync  | `crypto-js`                    |
| [@otplib/plugin-crypto-async-ronomon](./otplib-plugin-crypto-async-ronomon) | async | `@ronomon/crypto-async`        |

These crypto plugins provides:

```js
{
  createDigest, // used for token derivation
  createRandomBytes, //used to generate random keys for Google Authenticator
}
```

#### Plugins - Base32

| npm install                                                     | type | uses                                |
| --------------------------------------------------------------- | ---- | ----------------------------------- |
| [@otplib/plugin-thirty-two](./otplib-plugin-thirty-two)         | sync | `thirty-two`                        |
| [@otplib/plugin-base32-enc-dec](./otplib-plugin-base32-enc-dec) | sync | `base32-encode` and `base32-decode` |

These Base32 plugins provides:

```js
{
  keyDecoder, //for decoding Google Authenticator secrets
  keyEncoder, // for encoding Google Authenticator secrets.
}
```

### Presets

Presets are preconfigured HOTP, TOTP, Authenticator instances to
allow you to get started with the library quickly.

Each presets would need the corresponding dependent npm modules to be installed.

| npm install                                                   | description                                                |
| ------------------------------------------------------------- | ---------------------------------------------------------- |
| [@otplib/preset-default](./otplib-preset-default)             | A preset with the base32 and crypto plugins already setup. |
| [@otplib/preset-default-async](./otplib-preset-default-async) | Async version of `@otplib/preset-default`                  |
| [@otplib/preset-browser](./otplib-preset-browser)             | Webpack bundle and is a self contained umd bundle.         |
| [@otplib/preset-v11](./otplib-preset-v11)                     | Wrapper to adapt the APIs to v11.x compatible format       |

[docs-quick-start]: https://github.com/yeojz/otplib/blob/master/README.md#quick-start
