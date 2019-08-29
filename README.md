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
- [Migration and Versioning Guide](#migration-and-versioning-guide)
  - [Migrating from v11.x](#migrating-from-v11x)
  - [Downloading Master Builds](#downloading-master-builds)
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
  - [Async Options](#async-options)
- [Available Packages](#available-packages)
  - [Core](#core)
    - [Core (Async)](#core-async)
  - [Plugins](#plugins)
    - [Crypto Plugins](#crypto-plugins)
    - [Base32 Plugins](#base32-plugins)
  - [Presets](#presets)
- [Appendix](#appendix)
  - [Type Definitions](#type-definitions)
  - [Async Support](#async-support)
    - [Using Async Replacements](#using-async-replacements)
    - [Async over Sync Methods](#async-over-sync-methods)
  - [Browser Compatiblity](#browser-compatiblity)
    - [Browser bundle size](#browser-bundle-size)
  - [Length of Secrets](#length-of-secrets)
  - [Google Authenticator](#google-authenticator)
    - [Difference between Authenticator and TOTP](#difference-between-authenticator-and-totp)
    - [RFC3548 Base32](#rfc3548-base32)
    - [Displaying a QR code](#displaying-a-qr-code)
    - [Getting Time Remaining / Time Used](#getting-time-remaining--time-used)
  - [Using with Expo](#using-with-expo)
  - [Exploring with local-repl](#exploring-with-local-repl)
- [Contributors](#contributors)
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

- Typescript support
- [Class][link-mdn-classes] interfaces
- [Function][link-mdn-functions] interfaces
- [Async][link-mdn-async] interfaces
- Pluggable modules (crypto / base32)
  - `crypto (node)`
  - `crypto-js`
  - `@ronomon/crypto-async`
  - `thirty-two`
  - `base32-encode` + `base32-decode`
- Presets provided
  - `browser`
  - `default (node)`
  - `default-async (same as default, but with async methods)`
  - `v11 (adapter for previous version)`

## Quick Start

References:

- [API Documentation][project-api]
- [Demo Website][project-web]

### In Node.js

```bash
npm install otplib thirty-two
```

```js
import { authenticator } from 'otplib/preset-default';

const secret = 'KVKFKRCPNZQUYMLXOVYDSQKJKZDTSRLD';
// Alternative:
// const secret = authenticator.generateSecret();
// Note: .generateSecret() is only available for authenticator and not totp/hotp

const token = authenticator.generate(secret);

try {
  const isValid = authenticator.check(token, secret);
  // or
  const isValid = authenticator.verify({ token, secret });
} catch (err) {
  // Possible errors
  // - options validation
  // - "Invalid input - it is not base32 encoded string" (if thiry-two is used)
  console.error(err);
}
```

Please replace "authenticator" with totp or hotp depending on your requirements.

```js
// For TOTP
import { totp } from 'otplib/preset-default';
const token = totp.generate(secret);
const isValid = totp.check(token, secret);
const isValid = totp.verify({ token, secret });

// For HOTP
import { hotp } from 'otplib/preset-default';
const token = hotp.generate(secret, counter);
const isValid = hotp.check(token, secret, counter);
const isValid = hotp.verify({ token, secret, counter });
```

For all available APIs, please refer to [API Documentation][project-api].

### In Browser

The browser preset is a self contained `umd` module with `Buffer` split out as an external dependency.
As such, there are 2 scripts required: `preset-browser/index.js` and `preset-browser/buffer.js`.

```html
<script src="https://unpkg.com/otplib@^12.0.0/preset-browser/buffer.js"></script>
<script src="https://unpkg.com/otplib@^12.0.0/preset-browser/index.js"></script>

<script type="text/javascript">
  // window.otplib.authenticator
  // window.otplib.hotp
  // window.otplib.totp
</script>
```

The `buffer.js` provided by this library is a cached copy
from [https://www.npmjs.com/package/buffer][link-npm-buffer].
You can also download and include the latest version via their project page.

In the above example, we are directly using the scripts hosted by `unpkg.com`.
You can also `npm install otplib` and get a copy from the `node_modules/otplib/preset-browser` folder.

## Migration and Versioning Guide

This library follows `semver`. As such, major version bumps usually mean API changes or behavior changes.
Please check [upgrade notes](https://github.com/yeojz/otplib/wiki/upgrade-notes) for more information,
especially before making any major upgrades.

Check out the release notes associated with each tagged versions
in the [releases](https://github.com/yeojz/otplib/releases) page.

| Release Type         | Version Pattern | Command                                                          |                                       |
| :------------------- | --------------- | ---------------------------------------------------------------- | :------------------------------------ |
| Current / Stable     | 0.0.0           | `npm install otplib`                                             | [![npm][badge-npm]][project-npm]      |
| Release Candidate    | 0.0.0-0         | `npm install otplib@next`                                        | [![npm][badge-npm-next]][project-npm] |
| Master Branch Builds | 0.0.0-ci.{hash} | See: [Downloading Master Builds][docs-downloading-master-builds] |                                       |

### Migrating from v11.x

> v12.x is a huge architectural and language rewrite. Please check out the docs if you are migrating.
> A preset adapter is available to provide methods that behave like `v11.x` of `otplib`.

Link to [v11.x README.md][project-v11-readme] and [v11.x API Docs][project-v11-api].

```js
// Update
import { authenticator } from 'otplib'; // v11.x
// to
import { authenticator } from 'otplib/preset-v11';

// There should be no changes to your current code.
// However, deprecated or modified class methods will have console.warn.
```

### Downloading Master Builds

From 12.x onwards, pre-release builds of master is also uploaded as an artifact on GitHub Actions.

To download:

1. Go to otplib's [Github Actions][project-github-actions].
2. Click on `dev-builds`.
3. Select the latest `master` workflow run.
4. Click on the `Artifacts` dropdown near the top-right.
5. Download `otplib-ci-package.zip`.
6. Unzip the zip file, you should see a `otplib-ci-{hash}.tar.gz` file.
7. You can now run `npm install ./otplib-ci-{hash}.tar.gz` to install it into your project.

## Getting Started

This is a more in-depth setup guide for installing, configuring and customising
your dependencies for the library.

Check out the [Quick Start][docs-quick-start] guide if you do need / want
to customise any dependencies from the presets.

### Install the Package

```bash
npm install otplib
```

### Choose Your Plugins

#### Adding Crypto

The crypto modules are used to generate the digest used to derive the OTP tokens from.
By default, Node.js has inbuilt `crypto` functionality, but you might want to replace it
for certain environments that do not support it.

Currently out-of-the-box, there are some [Crypto Plugins][docs-plugins-crypto] included.
Install the dependencies for one of them.

```bash
# Choose either
# Node.js crypto (you don't need to install anything else - http://nodejs.org/api/crypto.html)

# or
npm install crypto-js
```

#### Adding Base32

If you're using Google Authenticator, you'll need a base32 module for
encoding and decoding your secrets.

Currently out-of-the-box, there are some [Base32 Plugins][docs-plugins-base32] included.
Install the dependencies for one of them.

```bash
# Choose either
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
import { keyDecoder, keyEncoder } from 'otplib/plugin-thirty-two';
// for base32-encode and base32-decode
import { keyDecoder, keyEncoder } from 'otplib/plugin-base32-enc-dec';

// Crypto Plugin
// for node crypto
import { createDigest, createRandomBytes } from 'otplib/plugin-crypto';
// for crypto-js
import { createDigest, createRandomBytes } from 'otplib/plugin-crypto-js';

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
import {
  hotpOptions,
  hotpToken,
  totpOptions,
  totpToken,
  authenticatorOptions,
  authenticatorToken
} from 'otplib/core';

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

All instantiated classes will have their options inherited from their respective options
generator. i.e. HOTP from `hotpOptions`, TOTP from `totpOptions`
and Authenticator from `authenticatorOptions`.

All OTP classes have an object setter and getter method to override these default options.

For example,

```js
import { authenticator, totp, hotp } from 'otplib/preset-default';

// setting
authenticator.options = { digits: 6 };
totp.options = { digits: 6 };
hotp.options = { digits: 6 };

// getting
const opts = authenticator.options;
const opts = totp.options;
const opts = hotp.options;

// reset to default
authenticator.resetOptions();
totp.resetOptions();
hotp.resetOptions();

// getting all options, with validation
// and backfilled with library defaults
const opts = authenticator.allOptions();
const opts = totp.allOptions();
const opts = hotp.allOptions();
```

### HOTP Options

| Option        | Type     | Description                                                                                                                     |
| ------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------- |
| algorithm     | string   | The algorithm used for calculating the HMAC.                                                                                    |
| createDigest  | function | Creates the digest which token is derived from.                                                                                 |
| createHmacKey | function | Formats the secret into a HMAC key, applying transformations (like padding) where needed.                                       |
| digest        | string   | **USE WITH CAUTION**. Same digest = same token. <br />Used in cases where digest is generated externally. (eg: async use cases) |
| digits        | integer  | The length of the token.                                                                                                        |
| encoding      | string   | The encoding that was used on the secret.                                                                                       |

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

| Option | Type                             | Description                                                                                                                                                                            |
| ------ | -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| epoch  | integer                          | **USE WITH CAUTION**. Same epoch = same token. <br />Starting time since the UNIX epoch (seconds). <br /> Epoch is JavaScript formatted. i.e. `Date.now()` or `UNIX time * 1000`       |
| step   | integer                          | Time step (seconds)                                                                                                                                                                    |
| window | integer, <br /> [number, number] | Tokens in the previous and future x-windows that should be considered valid. <br /> If integer, same value will be used for both. <br /> Alternatively, define array: `[past, future]` |

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

### Async Options

The following options are modified for `functions` and `classes` which are suffixed with `Async`.

eg: `AuthenticatorAsync`, `totpDigestAsync`, `hotpTokenAsync` etc.

| Option            | Type           | Output                                              |
| ----------------- | -------------- | --------------------------------------------------- |
| createDigest      | async function | function returns Promise<string\> instead of string |
| createHmacKey     | async function | function returns Promise<string\> instead of string |
| createRandomBytes | async function | function returns Promise<string\> instead of string |
| keyEncoder        | async function | function returns Promise<string\> instead of string |
| keyDecoder        | async function | function returns Promise<string\> instead of string |

## Available Packages

This library has been split into 3 categories: `core`, `plugin` and `preset`.

### Core

Provides the core functionality of the library. Parts of the logic
has been separated out in order to provide flexibility to the library via
available plugins.

| file                 | description                                          |
| -------------------- | ---------------------------------------------------- |
| otplib/hotp          | HOTP functions + class                               |
| otplib/hotp          | TOTP functions + class                               |
| otplib/authenticator | Google Authenticator functions + class               |
| otplib/core          | Aggregates hotp/totp/authenticator functions + class |

#### Core (Async)

| file                       | description                             |
| -------------------------- | --------------------------------------- |
| otplib/hotp-async          | async version of `otplib/hotp`          |
| otplib/hotp-async          | async version of `otplib/hotp`          |
| otplib/authenticator-async | async version of `otplib/authenticator` |
| otplib/core-async          | async version of `otplib/core`          |

### Plugins

#### Crypto Plugins

| plugin                             | type  | depends on                          |
| ---------------------------------- | ----- | ----------------------------------- |
| otplib/plugin-crypto               | sync  | crypto (included in Node.js)        |
| otplib/plugin-crypto-js            | sync  | `npm install crypto-js`             |
| otplib/plugin-crypto-async-ronomon | async | `npm install @ronomon/crypto-async` |

These crypto plugins provides:

```js
{
  createDigest, // used for token derivation
  createRandomBytes, //used to generate random keys for Google Authenticator
}
```

#### Base32 Plugins

| plugin                       | type | depends on                                |
| ---------------------------- | ---- | ----------------------------------------- |
| otplib/plugin-thirty-two     | sync | `npm install thirty-two`                  |
| otplib/plugin-base32-enc-dec | sync | `npm install base32-encode base32-decode` |

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

| file                        | depends on                                             | description                                          |
| --------------------------- | ------------------------------------------------------ | ---------------------------------------------------- |
| otplib/preset-default       | `npm install thirty-two`                               |                                                      |
| otplib/preset-default-async | `npm install thirty-two @ronomon/crypto-async`         | async version of `otplib/preset-default`             |
| otplib/preset-browser       | [See Browser Compatibility][docs-browser-compatiblity] | Webpack bundle and is self contained.                |
| otplib/preset-v11           | `npm install thirty-two`                               | Wrapper to adapt the APIs to v11.x compatible format |

## Appendix

### Type Definitions

`TypeScript` support was introduced in `v10.0.0`, which added type definitions over `.js` files.

As of `v12.0.0`, the library has been re-written in Typescript from the ground up.

### Async Support

`async` support was introduced in `v12.0.0`.

This was added as some libraries like [expo.io][link-expo-crypto] or even
the browser API ([window.Crypto.subtle][link-mdn-subtlecrypto]) started providing
only async methods.

There are 2 was to use `async` - using async replacements, or handling digests separately.

#### Using Async Replacements

This is the simplest way to get started. Other than `allOptions()` and `resetOptions`,
all other methods are converted to async and thus needs to be `Promise.resolve` or `await`.
eg: `await .generate(...)`, `await .check(...)`

```js
import { AuthenticatorAsync } from 'otplib/core-async';

const authenticator = new AuthenticatorAsync({
  // ...options
  // make sure you use async versions of
  // required functions like createDigest.
});

// Note: await needed as all methods are async
const token = await authenticator.generate(secret);
```

#### Async over Sync Methods

In this method, you would essentially take over the digest generation, leaving
the library to handle the digest to token conversion.

```js
import { Authenticator } from 'otplib/core';
import { authenticatorDigestAsync } from 'otplib/authenticator-async';

// This is a synchronous Authenticator class.
const authenticator = new Authenticator({
  // ...options
});

// Override the digest generation.
const digest = await authenticatorDigestAsync(secret, {
  ...authenticator.allOptions(),
  createDigest: async (algorithm, hmacKey, counter) => 'string'; // put your async implementation
});

authenticator.options = { digest };
const token = authenticator.generate(secret);

// recommended: reset to remove the digest.
authenticator.resetOptions();

// reference test in: ./packages/tests-builds/example.test.js
```

Check the [API Documentation][project-api] for the full list of async functions.
All async functions are suffixed with `Async` except for class methods.

### Browser Compatiblity

`otplib/preset-browser` is a `umd` bundle with some node modules replaced to reduce the browser size.

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
| optimised                         | 30.9KB     |
| **optimised, minified + gzipped** | **9.53KB** |

Paired with the gzipped browser `buffer.js` module, it would be about `7.65KB + 9.53KB = 17.18KB`.

### Length of Secrets

In [RFC 6238][rfc-6238], the secret / seed length for different algorithms are predefined:

```txt
HMAC-SHA1 - 20 bytes
HMAC-SHA256 - 32 bytes
HMAC-SHA512 - 64 bytes
```

As such, the length of the secret provided (after any decoding) will be padded and sliced
according to the expected length for respective algorithms.

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
See the [keyuri documentation](https://github.com/google/google-authenticator/wiki/Key-Uri-Format)
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

#### Getting Time Remaining / Time Used

Helper methods for getting the remaining time and used time within a validity period
of a `totp` or `authenticator` token were introduced in `v10.0.0`.

```js
authenticator.timeUsed(); // or totp.timeUsed();
authenticator.timeRemaining(); // or totp.timeRemaining();

// The start of a new token would be when:
// - timeUsed() === 0
// - timeRemaining() === step
```

### Using with Expo

[Expo][link-expo-io] contains modified crypto implmentations targeted at the platform.
While `otplib` does not provide an `expo` specified package, with the re-architecture
of `otplib`, you can now provide an expo native `createDigest` to the library.

Alternatively, you can make use of crypto provided by `otplib/plugin-crypto-js` or
the bundled browser umd module `otplib/preset-browser`.

Pull Requests are much welcomed for a native expo implementation as well.

### Exploring with local-repl

If you'll like to explore the library with `local-repl` you can do so as well.

```bash
$ npm run setup
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

## Contributors

Thanks goes to these wonderful people ([emoji key](https://allcontributors.org/docs/en/emoji-key)):

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tr>
    <td align="center"><a href="https://github.com/yeojz"><img src="https://avatars2.githubusercontent.com/u/429598?v=4" width="80px;" alt="Gerald Yeo"/><br /><sub><b>Gerald Yeo</b></sub></a><br /><a href="https://github.com/yeojz/otplib/commits?author=yeojz" title="Code">💻</a> <a href="https://github.com/yeojz/otplib/commits?author=yeojz" title="Documentation">📖</a> <a href="#maintenance-yeojz" title="Maintenance">🚧</a> <a href="https://github.com/yeojz/otplib/commits?author=yeojz" title="Tests">⚠️</a></td>
    <td align="center"><a href="https://ols.io"><img src="https://avatars3.githubusercontent.com/u/6209178?v=4" width="80px;" alt="Oliver Schneider"/><br /><sub><b>Oliver Schneider</b></sub></a><br /><a href="https://github.com/yeojz/otplib/commits?author=olsio" title="Documentation">📖</a></td>
    <td align="center"><a href="https://developer.mozilla.org/profiles/madarche/"><img src="https://avatars0.githubusercontent.com/u/152407?v=4" width="80px;" alt="Marc-Aurèle DARCHE"/><br /><sub><b>Marc-Aurèle DARCHE</b></sub></a><br /><a href="https://github.com/yeojz/otplib/commits?author=madarche" title="Documentation">📖</a></td>
    <td align="center"><a href="http://shakram02.github.io/"><img src="https://avatars3.githubusercontent.com/u/10996982?v=4" width="80px;" alt="Ahmed Hamdy (@shakram02)"/><br /><sub><b>Ahmed Hamdy (@shakram02)</b></sub></a><br /><a href="https://github.com/yeojz/otplib/commits?author=shakram02" title="Documentation">📖</a></td>
    <td align="center"><a href="https://tony.brix.ninja"><img src="https://avatars3.githubusercontent.com/u/97994?v=4" width="80px;" alt="Tony Brix"/><br /><sub><b>Tony Brix</b></sub></a><br /><a href="https://github.com/yeojz/otplib/commits?author=UziTech" title="Code">💻</a> <a href="https://github.com/yeojz/otplib/commits?author=UziTech" title="Documentation">📖</a></td>
  </tr>
</table>

<!-- markdownlint-enable -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [all-contributors](https://github.com/all-contributors/all-contributors)
specification. Contributions of any kind welcome!

## License

`otplib` is [MIT licensed](./LICENSE)

<img width="150" src="https://otplib.yeojz.com/otplib.png" />

[badge-circle]: https://img.shields.io/circleci/project/github/yeojz/otplib/master.svg?style=flat-square
[badge-coveralls]: https://img.shields.io/coveralls/yeojz/otplib/master.svg?style=flat-square
[badge-npm-downloads]: https://img.shields.io/npm/dt/otplib.svg?style=flat-square
[badge-npm]: https://img.shields.io/npm/v/otplib.svg?style=flat-square
[badge-npm-next]: https://img.shields.io/npm/v/otplib/next.svg?style=flat-square
[badge-type-ts]: https://img.shields.io/badge/typedef-.d.ts-blue.svg?style=flat-square&longCache=true
[docs-browser-compatiblity]: #browser-compatiblity
[docs-downloading-master-builds]: #downloading-master-builds
[docs-plugins-base32]: #base32-plugins
[docs-plugins-crypto]: #crypto-plugins
[docs-quick-start]: #quick-start
[link-expo-crypto]: https://docs.expo.io/versions/v33.0.0/sdk/crypto/
[link-expo-io]: https://expo.io
[link-mdn-async]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function
[link-mdn-classes]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes
[link-mdn-functions]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions
[link-mdn-subtlecrypto]: https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto
[link-npm-buffer]: https://www.npmjs.com/package/buffer
[project-api]: https://otplib.yeojz.com/api
[project-circle]: https://circleci.com/gh/yeojz/otplib
[project-coveralls]: https://coveralls.io/github/yeojz/otplib
[project-docs]: https://otplib.yeojz.com/api
[project-github-actions]: https://github.com/yeojz/otplib/actions
[project-npm]: https://www.npmjs.com/package/otplib
[project-v11-api]: https://5d4d0cc4c85e00000788a456--otplib.netlify.com/docs
[project-v11-readme]: https://github.com/yeojz/otplib/blob/d0aedccbca8ae7ec1983f40da4d7a14c9e815e9c/README.md
[project-web]: https://otplib.yeojz.com
[rfc-3548]: http://tools.ietf.org/html/rfc3548
[rfc-4648]: https://tools.ietf.org/html/rfc4648
[rfc-4226-dataset]: https://github.com/yeojz/otplib/blob/master/packages/tests-data/rfc4226.ts
[rfc-4226-wiki]: http://en.wikipedia.org/wiki/HMAC-based_One-time_Password_Algorithm
[rfc-4226]: http://tools.ietf.org/html/rfc4226
[rfc-6238-dataset]: https://github.com/yeojz/otplib/blob/master/packages/tests-data/rfc6238.ts
[rfc-6238-wiki]: http://en.wikipedia.org/wiki/Time-based_One-time_Password_Algorithm
[rfc-6238]: http://tools.ietf.org/html/rfc6238
