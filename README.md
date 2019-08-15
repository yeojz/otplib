# otplib

> Time-based (TOTP) and HMAC-based (HOTP) One-Time Password library

[![npm][badge-npm]][project-npm]
[![Build Status][badge-circle]][project-circle]
[![Coverage Status][badge-coveralls]][project-coveralls]
[![npm downloads][badge-npm-downloads]][project-npm]
[![TypeScript Support][badge-type-ts]][project-docs]

---

<!-- TOC depthFrom:2 -->

- [About](#about)
- [Features](#features)
- [Quick Start](#quick-start)
  - [In Node.js](#in-nodejs)
  - [In Browser](#in-browser)
- [Migration Guide](#migration-guide)
- [Getting Started](#getting-started)
  - [Install the Package](#install-the-package)
  - [Choose Your Plugins](#choose-your-plugins)
    - [Adding Crypto](#adding-crypto)
    - [Adding Base32](#adding-base32)
  - [Initialise your Instance](#initialise-your-instance)
    - [Using Classes](#using-classes)
    - [Using Functions](#using-functions)
- [Available Options](#available-options)
  - [HOTP Options](#hotp-options)
  - [TOTP Options](#totp-options)
  - [Authenticator Options](#authenticator-options)
- [Available Packages](#available-packages)
  - [Core](#core)
  - [Plugins](#plugins)
    - [Crypto Plugins](#crypto-plugins)
    - [Base32 Plugins](#base32-plugins)
  - [Presets](#presets)
- [Notes](#notes)
  - [Browser Compatiblity](#browser-compatiblity)
    - [Browser bundle size](#browser-bundle-size)
  - [Google Authenticator](#google-authenticator)
    - [Difference between Authenticator and TOTP](#difference-between-authenticator-and-totp)
    - [RFC3548 Base32](#rfc3548-base32)
    - [Displaying a QR code](#displaying-a-qr-code)
  - [Exploring with local-repl](#exploring-with-local-repl)
- [License](#license)

<!-- /TOC -->

## About

`otplib` is a JavaScript One Time Password (OTP) library for OTP generation and verification.

It implements both [HOTP][rfc-4226-wiki] - [RFC 4226][rfc-4226]
and [TOTP][rfc-6238-wiki] - [RFC 6238][rfc-6238],
and are tested against the test vectors provided in their respective RFC specifications.
These datasets can be found in the `packages/tests-data` folder.

- [RFC 4226 Dataset][rfc-4226-dataset]
- [RFC 6238 Dataset][rfc-6238-dataset]

This library is also compatible with [Google Authenticator](https://github.com/google/google-authenticator),
and includes additional methods to allow you to work with Google Authenticator.

## Features

- [x] Typescript support
- [x] [Class][link-mdn-classes] interfaces
- [x] [Function][link-mdn-functions] interfaces
- [x] Pluggable modules (base32 / crypto)
  - `crypto (node)`
  - `cryptojs`
  - `thirty-two`
  - `base32-encode` + `base32-decode`
- [x] Presets provided
  - `default (node)`
  - `browser`
  - `v11 (legacy)`

## Quick Start

### In Node.js

```bash
npm install otplib thirty-two
```

```js
import { authenticator } from 'otplib/preset-default';

const secret = 'KVKFKRCPNZQUYMLXOVYDSQKJKZDTSRLD';
// Alternatively: const secret = authenticator.generateSecret();

const token = otplib.authenticator.generate(secret);

try {
  const isValid = otplib.authenticator.check(token, secret);
  // or
  const isValid = otplib.authenticator.verify({ token, secret });
} catch (err) {
  // Error possibly thrown by the thirty-two package
  // 'Invalid input - it is not base32 encoded string'
  console.error(err);
}
```

### In Browser

The browser preset is a self contained module, with `Buffer` split out as an external dependency.

As such, there are 2 scripts required. The `preset-browser/index.js` script
as well as `preset-browser/buffer.js`.

```html
<script src="https://unpkg.com/otplib@^12.0.0/preset-browser/buffer.js"></script>
<script src="https://unpkg.com/otplib@^12.0.0/preset-browser/index.js"></script>

<script type="text/javascript">
  // window.otplib.authenticator
  // window.otplib.hotp
  // window.otplib.totp
</script>
```

The `buffer.js` provided in by this library is a cached copy
from [https://www.npmjs.com/package/buffer][link-npm-buffer].
You can also download and include the latest version via their project page.

## Migration Guide

This library follows `semver`. As such, major version bumps usually mean API changes or behavior changes.
Please check [upgrade notes](https://github.com/yeojz/otplib/wiki/upgrade-notes) for more information,
especially before making any major upgrades.

Check out the release notes associated with each tagged versions
in the [releases](https://github.com/yeojz/otplib/releases) page.

## Getting Started

This is a more in-depth setup which has more customisation steps.

Check out the [Quick Start][docs-quick-start] if you do not need such customisation.

### Install the Package

```bash
npm install otplib
```

### Choose Your Plugins

#### Adding Crypto

The crypto modules are used to generate the digest used to derive the OTP tokens from.
By default, Node.js has inbuilt `crypto` functionality, but you might want to replace it
for certain environments that do not support it.

```bash
# choose either node crypto
# (you don't need to install anything else)
# or
npm install crypto-js
```

#### Adding Base32

If you're using Google Authenticator, you'll need a base32 module for
encoding and decoding your secrets.

Currently out-of-the-box, there are already some plugins included.
Install the dependencies for one of them.

```bash
# choose either
npm install thirty-two
# or
npm install base32-encode base32-decode
```

### Initialise your Instance

#### Using Classes

```js
import { HOTP, TOTP, Authenticator } from 'otplib';

// Base32 Plugin
// for thirty-two
import { keyDecoder, keyEncoder } from 'otplib/base32/thirty-two';
// for base32-encode and base32-decode
import { keyDecoder, keyEncoder } from 'otplib/base32/base32-endec';

// Crypto Plugin
// for node crypto
import { createDigest, createRandomBytes } from 'otplib-plugin-crypto';
// for crypto-js
import { createDigest, createRandomBytes } from 'otplib-plugin-crypto-js';

// Setup an OTP instance which you need
const hotp = new HOTP({ createDigest });
const totp = new TOTP({ createDigest });
const authenticator = new Authenticator({
  createDigest,
  createRandomBytes,
  keyDecoder,
  keyEncoder
});

// Go forth and generate tokens
const token = hotp.generate(YOUR_SECRET, 0);
const token = totp.generate(YOUR_SECRET);
const token = authenticator.generate(YOUR_SECRET);
```

#### Using Functions

Alternatively, if you are using the functions directly instead of the classes,
pass these as options into the functions.

```js
import { hotpOptions, hotpToken } from 'otplib/hotp';
import { totpOptions, totpToken } from 'otplib/totp';
import { authenticatorOptions, authenticatorToken } from 'otplib/authenticator';

// As with classes, import your desired Base32 Plugin and Crypto Plugin.
// import ...

// Go forth and generate tokens
const token = hotpToken(YOUR_SECRET, 0, hotpOptions({ createDigest));
const token = totpToken(YOUR_SECRET, totpOptions({ createDigest));
const token = authenticatorToken(YOUR_SECRET, authenticatorOptions({
  createDigest,
  createRandomBytes,
  keyDecoder,
  keyEncoder
));
```

## Available Options

### HOTP Options

| Option        | Type     | Description                                                                               |
| ------------- | -------- | ----------------------------------------------------------------------------------------- |
| algorithm     | string   | The algorithm used for calculating the HMAC.                                              |
| createDigest  | function | Creates the digest which token is derived from.                                           |
| createHmacKey | function | Formats the secret into a HMAC key, applying transformations (like padding) where needed. |
| digits        | integer  | The length of the token.                                                                  |
| encoding      | string   | The encoding that was used on the secret.                                                 |

```js
// HOTP defaults
{
  algorithm: 'sha1'
  createDigest: undefined, // to be provided via a otplib-plugin
  createHmacKey: hotpCreateHmacKey,
  digits: 6,
  encoding: 'ascii',
}
```

### TOTP Options

> Note: Includes all HOTP Options

| Option | Type                             | Description                                                                                                                                                                                |
| ------ | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| epoch  | integer                          | Starting time since the UNIX epoch (seconds). <br /> epoch format is javascript. i.e. `Date.now()` or `UNIX time * 1000`                                                                   |
| step   | integer                          | Time step (seconds)                                                                                                                                                                        |
| window | integer, <br /> [number, number] | Tokens in the previous and future x-windows that should be considered valid. <br /> If integer, same value will be used for both. <br /> Alternatively, define array: `[previous, future]` |

```js
// TOTP defaults
{
  // ...includes all HOTP defaults
  createHmacKey: totpCreateHmacKey,
  epoch: Date.now(),
  step: 30,
  window: 0,
}
```

### Authenticator Options

> Note: Includes all HOTP + TOTP Options

| Option            | Type     | Description                                                                                           |
| ----------------- | -------- | ----------------------------------------------------------------------------------------------------- |
| createRandomBytes | function | Creates a random string containing the defined number of bytes to be used in generating a secret key. |
| keyEncoder        | function | Encodes a secret key into a Base32 string before it is sent to the user (in QR Code etc).             |
| keyDecoder        | function | Decodes the Base32 string given by the user into a secret.                                            |

```js
// Authenticator defaults
{
  // ...includes all HOTP + TOTP defaults
  encoding: 'hex',
  createRandomBytes: undefined, // to be provided via a otplib-plugin
  keyEncoder: undefined, // to be provided via a otplib-plugin
  keyDecoder: undefined, // to be provided via a otplib-plugin
}
```

## Available Packages

This library has been split into 3 categories: `core`, `plugin` and `preset`.

### Core

These provides the main functionality of the library. However parts of the logic
has been separated out in order to provide flexibility to the library.

| file                 | description                                          |
| -------------------- | ---------------------------------------------------- |
| otplib/hotp          | HOTP functions + class                               |
| otplib/hotp          | TOTP functions + class                               |
| otplib/authenticator | Google Authenticator functions + class               |
| otplib/core          | Aggregates hotp/totp/authenticator functions + class |

### Plugins

#### Crypto Plugins

These crypto plugins provides:

- `createDigest` - used for token derivation
- `createRandomBytes` - used to generate random keys for Google Authenticator

| plugin                 | npm                     |
| ---------------------- | ----------------------- |
| otplib/plugin-crypto   | node crypto             |
| otplib/plugin-cryptojs | `npm install crypto-js` |

#### Base32 Plugins

These Base32 plugins provides `keyDecoder` and `keyEncoder` for decoding and encoding
secrets for Google Authenticator respectively.

| plugin                       | npm                                       |
| ---------------------------- | ----------------------------------------- |
| otplib/plugin-thirty-two     | `npm install thirty-two`                  |
| otplib/plugin-base32-enc-dec | `npm install base32-encode base32-decode` |

### Presets

Presets are preconfigured HOTP, TOTP, Authenticator instances to allow for quick starts.

They would need the corresponding npm modules to be installed (except
for `preset-browser` which bundles in the dependents).

| file                  | description                                                    |
| --------------------- | -------------------------------------------------------------- |
| otplib/preset-default | Uses node crypto + thirty-two                                  |
| otplib/preset-browser | Webpack bundle. Uses base32-encode + base32-decode + crypto-js |
| otplib/preset-v11     | Wrapper to adapt the APIs to v11.x compatible format           |

## Notes

### Browser Compatiblity

`otplib-preset-browser` is a `umd` bundle with some node modules replaced to reduce the browser size.

The following defaults have been used:

- **crypto**: `crypto-js`
- **encoder**: `base32-encode`
- **decoder**: `base32-decode`

To see what is included, you can take a look at `packages/otplib-browser/index.ts`.

#### Browser bundle size

The approximate **bundle sizes** are as follows:

| Bundle Type                       | Size       |
| --------------------------------- | ---------- |
| original                          | 324KB      |
| original, minified + gzipped      | 102KB      |
| optimised                         | 28.3KB     |
| **optimised, minified + gzipped** | **9.12KB** |

Paired with the gzipped browser `buffer.js` module, it would be about `7.65KB + 9.12KB = 16.77KB`.

### Google Authenticator

#### Difference between Authenticator and TOTP

The default encoding option has been set to `hex` (Authenticator) instead of `ascii` (TOTP).

#### RFC3548 Base32

> Note: [RFC4648][rfc-4648] obseletes [RFC 3548][rfc-3548].
> Any encoders following the newer specifications will work.

Google Authenticator requires keys to be base32 encoded.
It also requires the base32 encoder to be [RFC 3548][rfc-3548] compliant.

OTP calculation will still work should you want to use
other base32 encoding methods (like Crockford's Base32)
but it will NOT be compatible with Google Authenticator.

```js
const secret = authenticator.generateSecret(); // base32 encoded hex secret key
const token = authenticator.generate(secret);
```

#### Displaying a QR code

You may want to generate and display a QR Code so that users can scan
instead of manually entering the secret. Google Authenticator and similar apps
take in a QR code that holds a URL with the protocol `otpauth://`,
which you get from `authenticator.keyuri`.

Google Authenticator will ignore the `algorithm`, `digits`, and `step` options.
See the [documentation](https://github.com/google/google-authenticator/wiki/Key-Uri-Format)
for more information.

If you are using a different authenticator app, check the documentation
for that app to see if any options are ignored, which will result in invalid tokens.

While this library provides the "otpauth" uri, you'll need a library to
generate the QR Code image.

An example is shown below:

```js
// npm install qrcode
import qrcode from 'qrcode';
import { authenticator } from 'otplib/preset-default';

const user = 'A user name, possibly an email';
const service = 'A service name';

// v11.x.x and above
const otpauth = authenticator.keyuri(user, service, secret);

// v10.x.x and below
const otpauth = authenticator.keyuri(
  encodeURIComponent(user),
  encodeURIComponent(service),
  secret
);

qrcode.toDataURL(otpauth, (err, imageUrl) => {
  if (err) {
    console.log('Error with QR');
    return;
  }
  console.log(imageUrl);
});
```

> **Note**: For versions `v10.x.x` and below, `keyuri` does not URI encode
> `user` and `service`. You'll need to do so before passing in the parameteres.

### Exploring with local-repl

If you'll like to explore the library with `local-repl` you can do so as well.

```bash
$ npm install
$ npm run build

$ npx local-repl
# You should see something like:
# Node v8.9.4, local-repl 4.0.0
# otplib 10.0.0
# Context: otplib
# [otplib] >

$ [otplib] > secret = 'KVKFKRCPNZQUYMLXOVYDSQKJKZDTSRLD'
$ [otplib] > otplib.authenticator.generate(secret)
```

## License

`otplib` is [MIT licensed](./LICENSE)

<img width="150" src="https://otplib.yeojz.com/otplib.png" />

[badge-circle]: https://img.shields.io/circleci/project/github/yeojz/otplib/master.svg?style=flat-square
[badge-coffee]: https://img.shields.io/badge/%E2%98%95%EF%B8%8F-buy%20me%20a%20coffee-orange.svg?longCache=true&style=flat-square
[badge-coveralls]: https://img.shields.io/coveralls/yeojz/otplib/master.svg?style=flat-square
[badge-npm-downloads]: https://img.shields.io/npm/dt/otplib.svg?style=flat-square
[badge-npm-next]: https://img.shields.io/npm/v/otplib/next.svg?style=flat-square
[badge-npm]: https://img.shields.io/npm/v/otplib.svg?style=flat-square
[badge-pr-welcome]: https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square&longCache=true
[badge-type-ts]: https://img.shields.io/badge/typedef-.d.ts-blue.svg?style=flat-square&longCache=true
[docs-quick-start]: #quick-start
[link-mdn-classes]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes
[link-mdn-crypto]: https://developer.mozilla.org/en-US/docs/Web/API/Window/crypto
[link-mdn-functions]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions
[link-npm-buffer]: https://www.npmjs.com/package/buffer
[project-circle]: https://circleci.com/gh/yeojz/otplib
[project-coffee]: https://paypal.me/yeojz
[project-coveralls]: https://coveralls.io/github/yeojz/otplib
[project-docs]: https://otplib.yeojz.com/docs
[project-npm]: https://www.npmjs.com/package/otplib
[project-pr-welcome]: https://github.com/yeojz/otplib/blob/master/CONTRIBUTING.md
[project-web]: https://otplib.yeojz.com
[rfc-3548]: http://tools.ietf.org/html/rfc3548
[rfc-4648]: https://tools.ietf.org/html/rfc4648
[rfc-4226-dataset]: https://github.com/yeojz/otplib/blob/master/packages/tests-data/rfc4226.ts
[rfc-4226-wiki]: http://en.wikipedia.org/wiki/HMAC-based_One-time_Password_Algorithm
[rfc-4226]: http://tools.ietf.org/html/rfc4226
[rfc-6238-dataset]: https://github.com/yeojz/otplib/blob/master/packages/tests-data/rfc6238.ts
[rfc-6238-wiki]: http://en.wikipedia.org/wiki/Time-based_One-time_Password_Algorithm
[rfc-6238]: http://tools.ietf.org/html/rfc6238
