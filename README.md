# otplib

> Time-based (TOTP) and HMAC-based (HOTP) One-Time Password library

[![npm][npm-badge]][npm-link]
[![Build Status][circle-badge]][circle-link]
[![Coverage Status][coveralls-badge]][coveralls-link]
[![npm downloads][npm-downloads-badge]][npm-link]
[![TypeScript Support][type-ts-badge]][type-ts-link]

---

<!-- TOC depthFrom:2 -->

- [About](#about)
- [Demo and Documentation](#demo-and-documentation)
- [Installation](#installation)
  - [Type Definitions](#type-definitions)
- [Upgrading](#upgrading)
- [Getting Started](#getting-started)
  - [In node](#in-node)
    - [Using specific OTP implementations](#using-specific-otp-implementations)
    - [Using classes](#using-classes)
    - [Using with Expo.io](#using-with-expoio)
  - [In browser](#in-browser)
    - [Browser Compatibility](#browser-compatibility)
- [Advanced Usage](#advanced-usage)
  - [Core](#core)
  - [Other Bundles](#other-bundles)
- [Notes](#notes)
  - [Setting Custom Options](#setting-custom-options)
    - [Available Options](#available-options)
  - [Seed / secret length](#seed--secret-length)
  - [Google Authenticator](#google-authenticator)
    - [Difference between Authenticator and TOTP](#difference-between-authenticator-and-totp)
    - [Base32 Keys and RFC3548](#base32-keys-and-rfc3548)
    - [Displaying a QR code](#displaying-a-qr-code)
  - [Getting Time Remaining / Time Used](#getting-time-remaining--time-used)
  - [Exploring with local-repl](#exploring-with-local-repl)
- [Contributing](#contributing)
- [License](#license)

<!-- /TOC -->

## About

`otplib` is a JavaScript One Time Password (OTP) library.
It provides both functional and class based interfaces for
dealing with OTP generation and verification.

It implements both [HOTP][rfc-4226-wiki] - [RFC 4226][rfc-4226]
and [TOTP][rfc-6238-wiki] - [RFC 6238][rfc-6238],
and are tested against the test vectors provided in their respective RFC specifications.
These datasets can be found in the `packages/tests` folder.

- [RFC 4226 Dataset](https://github.com/yeojz/otplib/blob/master/packages/tests/rfc4226.js)
- [RFC 6238 Dataset](https://github.com/yeojz/otplib/blob/master/packages/tests/rfc6238.js)

This library is also compatible with [Google Authenticator](https://github.com/google/google-authenticator),
and includes additional methods to allow you to work with Google Authenticator.

## Demo and Documentation

- [Documentation][project-docs]
- [Demo][project-web]
- [FAQ / Common Issues](https://github.com/yeojz/otplib/wiki/FAQ)
- [List of available methods][type-ts-file] (documented via TypeScript)
- [Examples][project-examples]

## Installation

Install the library via:

```bash
$ npm install otplib --save

# To install the Release Candidates:
$ npm install otplib@next --save

# Additional dependencies for TypeScript
$ npm install @types/node
```

| Release Type      | Version                            |
| :---------------- | :--------------------------------- |
| Current / Stable  | [![npm][npm-badge]][npm-link]      |
| Release Candidate | [![npm][npm-next-badge]][npm-link] |

### Type Definitions

`TypeScript` support was introduced in `v10.0.0`

## Upgrading

This library follows `semver`. As such, major version bumps usually mean API changes or behavior changes.
Please check [upgrade notes](https://github.com/yeojz/otplib/wiki/upgrade-notes) for more information,
especially before making any major upgrades.

You might also want to check out the release notes associated with each tagged versions
in the [releases](https://github.com/yeojz/otplib/releases) page.

## Getting Started

### In node

```js
import otplib from 'otplib';

const secret = 'KVKFKRCPNZQUYMLXOVYDSQKJKZDTSRLD'
// Alternatively: const secret = otplib.authenticator.generateSecret();

const token = otplib.authenticator.generate(secret);

const isValid = otplib.authenticator.check(token, secret);
// or
const isValid = otplib.authenticator.verify({ token, secret })
```

#### Using specific OTP implementations

If you want to include a specific OTP specification, you can import it directly:

```js
import hotp from 'otplib/hotp';
import totp from 'otplib/totp';
import authenticator from 'otplib/authenticator';
```

**Important**: If you import the libraries directly, you will have to provide a crypto
solution (this is to allow custom crypto solutions), as long as they implement `createHmac` and `randomBytes`.
Take a look at the [browser implementation](https://github.com/yeojz/otplib/blob/master/packages/otplib-browser)
of this package as an example.

For **example**:

```js
import authenticator from 'otplib/authenticator';
import crypto from 'crypto';

authenticator.options = { crypto };

// Or if you're using the other OTP methods
// hotp.options = { crypto }
// totp.options = { crypto }

const secret = 'KVKFKRCPNZQUYMLXOVYDSQKJKZDTSRLD'
const token = authenticator.generate(secret); // 556443
```

#### Using classes

For ease of use, the default exports are all instantiated instances of their respective classes.
You can access the original classes via it's same name property of the instantiated class.

i.e

```js
import hotp from 'otplib/hotp';
const HOTP = hotp.HOTP;
// const inst = new HOTP();

import totp from 'otplib/totp';
const TOTP = totp.TOTP;
// const inst = new TOTP();

import authenticator from 'otplib/authenticator';
const Authenticator = authenticator.Authenticator;
// const inst = new Authenticator();

// Alternatively, you can get it from the default module as well
import otplib from 'otplib';
const HOTP = otplib.hotp.HOTP
const TOTP = otplib.totp.TOTP
const Authenticator = otplib.authenticator.Authenticator
```

#### Using with Expo.io

[Expo](https://expo.io) does not contain a `randomBytes` implementation
within the platform-provided crypto. As such, you should avoid
using `otplib.authenticator.generateSecret();` and generate your own secrets instead.

### In browser

A browser-targeted version has been compiled.
You'll need to add the following scripts to your code:

```html
<script src="otplib-browser.js"></script>

<script type="text/javascript">
   // window.otplib
</script>
```

You can find it in `node_modules/otplib` after you install.

Alternatively you can

- Download from [gh-pages][project-lib].
- Use unpkg.com

```html
<script src="https://unpkg.com/otplib@^10.0.0/otplib-browser.js"></script>
```

For a live example, the [project site][project-web] has been built using `otplib-browser.js`.
The source code can be found [here](https://github.com/yeojz/otplib/tree/master/site).

#### Browser Compatibility

In order to reduce the size of the browser package, the `crypto` package has been replaced with
an alternative implementation. The current implementation depends on [Uint8Array][mdn-uint8array]
and the browser's native [crypto][mdn-crypto] methods, which may only be available in
recent browser versions.

To find out more about the replacements, you can take a look at `packages/otplib-browser/crypto.js`

The approximate **output sizes** are as follows:

- with node crypto: ~311Kb
- with alternative crypto: ~106Kb

## Advanced Usage

Ihis library been split and classified into 6 core files with other specific
environment based bundles provided.

### Core

| file                                                                                     | description                                                     |
| ---------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| [authenticator.js](https://yeojz.github.io/otplib/docs/module-otplib-authenticator.html) | Google Authenticator bindings                                   |
| [core.js](https://yeojz.github.io/otplib/docs/module-otplib-core.html)                   | Functions for various steps in the OTP generation process       |
| [hotp.js](https://yeojz.github.io/otplib/docs/module-otplib-hotp.html)                   | Wraps core functions into an instantiated HOTP class            |
| [otplib.js](https://yeojz.github.io/otplib/docs/module-otplib.html)                      | Library entry file, containing all instances with crypto set up |
| [totp.js](https://yeojz.github.io/otplib/docs/module-otplib-totp.html)                   | Wraps core functions into an instantiated TOTP class            |
| [utils.js](https://yeojz.github.io/otplib/docs/module-otplib-utils.html)                 | Helper utilities                                                |

### Other Bundles

| file                                                                                | description                                   |
| ----------------------------------------------------------------------------------- | --------------------------------------------- |
| [otplib-browser.js](https://yeojz.github.io/otplib/docs/module-otplib-browser.html) | Browser compatible package built with webpack |

For more information about the functions, check out the [documentation][project-docs].

## Notes

### Setting Custom Options

All instantiated classes will have their options inherited from their respective options
generator. i.e. HOTP from `hotpOptions` and TOTP/Authenticator from `totpOptions`.

All OTP classes have an object setter and getter method to override these default options.

For example,

```js
import otplib from 'otplib';

// setting
otplib.authenticator.options = {
  step: 30,
  window: 1
};

// getting
const opts = otplib.authenticator.options;

// reset to default
otplib.authenticator.resetOptions();
```

#### Available Options

| Option                       | Type             | Defaults                          | Description                                                                                                                                                                                |
| ---------------------------- | ---------------- | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| algorithm                    | string           | 'sha1'                            | Algorithm used for HMAC                                                                                                                                                                    |
| createHmacSecret             | function         | hotpSecret, totpSecret            | Transforms the secret and applies any modifications like padding to it.                                                                                                                    |
| crypto                       | object           | node crypto                       | Crypto module to use.                                                                                                                                                                      |
| digits                       | integer          | 6                                 | The length of the token                                                                                                                                                                    |
| encoding                     | string           | 'ascii' ('hex' for authenticator) | The encoding of secret which is given to digest                                                                                                                                            |
| epoch (totp, authenticator)  | integer          | null                              | Starting time since the UNIX epoch (seconds). <br /> epoch format is non-javascript. i.e. `Date.now() / 1000`                                                                              |
| step (totp, authenticator)   | integer          | 30                                | Time step (seconds)                                                                                                                                                                        |
| window (totp, authenticator) | integer or array | 0                                 | Tokens in the previous and future x-windows that should be considered valid. <br /> If integer, same value will be used for both. <br /> Alternatively, define array: `[previous, future]` |

### Seed / secret length

In [RFC 6238][rfc-6238], the secret / seed length for different algorithms is predefined:

```txt
HMAC-SHA1 - 20 bytes
HMAC-SHA256 - 32 bytes
HMAC-SHA512 - 64 bytes
```

As such, the length of the secret is padded and sliced according to the expected
length for respective algorithms.

### Google Authenticator

#### Difference between Authenticator and TOTP

The default encoding option has been set to `hex` (Authenticator) instead of `ascii` (TOTP).

#### Base32 Keys and RFC3548

Google Authenticator requires keys to be base32 encoded.
It also requires the base32 encoder to be [RFC 3548][rfc-3548] compliant.

OTP calculation will still work should you want to use
other base32 encoding methods (like Crockford's Base 32)
but it will NOT be compatible with Google Authenticator.

```js
import authenticator from 'otplib/authenticator';

const secret = authenticator.generateSecret(); // base 32 encoded hex secret key
const token = authenticator.generate(secret);
```

#### Displaying a QR code

You may want to generate and display a QR Code so that users can scan
instead of manually entering the secret. Google Authenticator and similar apps
take in a QR code that holds a URL with the protocol `otpauth://`,
which you get from `otplib.authenticator.keyuri`.

While this library provides the "otpauth" uri, you'll need a library to generate the QR Code image.

An example is shown below:

```js
// npm install qrcode
import qrcode from 'qrcode';
import otplib from 'otplib';

const otpauth = otplib.authenticator.keyuri('user', 'service', secret);

qrcode.toDataURL(otpauth, (err, imageUrl) => {
  if (err) {
    console.log('Error with QR');
    return;
  }
  console.log(imageUrl);
});
```

### Getting Time Remaining / Time Used

Helper methods for getting the remaining time and used time within a validity period
of a `totp` or `authenticator` token were introduced in `v10.0.0`.

```js
authenticator.timeUsed(); // or totp.timeUsed();
authenticator.timeRemaining(); // or totp.timeRemaining();

// The start of a new token would be when:
// - timeUsed() === 0
// - timeRemaining() === step
```

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

## Contributing

Check out: [CONTRIBUTING.md][pr-welcome-link]

[![Support Project][coffee-badge]][coffee-link]
[![PRs Welcome][pr-welcome-badge]][pr-welcome-link]

## License

`otplib` is [MIT licensed](./LICENSE)

<img width="150" src="https://yeojz.github.io/otplib/otplib.png" />

[npm-badge]: https://img.shields.io/npm/v/otplib.svg?style=flat-square
[npm-link]: https://www.npmjs.com/package/otplib
[npm-next-badge]: https://img.shields.io/npm/v/otplib/next.svg?style=flat-square
[npm-downloads-badge]: https://img.shields.io/npm/dt/otplib.svg?style=flat-square
[circle-badge]: https://img.shields.io/circleci/project/github/yeojz/otplib/master.svg?style=flat-square
[circle-link]: https://circleci.com/gh/yeojz/otplib
[coveralls-badge]: https://img.shields.io/coveralls/yeojz/otplib/master.svg?style=flat-square
[coveralls-link]: https://coveralls.io/github/yeojz/otplib
[pr-welcome-badge]: https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square&longCache=true
[pr-welcome-link]: https://github.com/yeojz/otplib/blob/master/CONTRIBUTING.md
[mdn-uint8array]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array
[mdn-crypto]: https://developer.mozilla.org/en-US/docs/Web/API/Window/crypto
[project-web]: https://yeojz.github.io/otplib
[project-docs]: https://yeojz.github.io/otplib/docs
[project-lib]: https://github.com/yeojz/otplib/tree/gh-pages/lib
[project-examples]: https://github.com/yeojz/otplib/tree/master/examples
[rfc-4226]: http://tools.ietf.org/html/rfc4226
[rfc-6238]: http://tools.ietf.org/html/rfc6238
[rfc-3548]: http://tools.ietf.org/html/rfc3548
[rfc-4226-wiki]: http://en.wikipedia.org/wiki/HMAC-based_One-time_Password_Algorithm
[rfc-6238-wiki]: http://en.wikipedia.org/wiki/Time-based_One-time_Password_Algorithm
[donate-badge]: https://img.shields.io/badge/donate-%3C3-red.svg?longCache=true&style=flat-square
[donate-link]: https://www.paypal.me/yeojz
[coffee-badge]: https://img.shields.io/badge/%E2%98%95%EF%B8%8F-buy%20me%20a%20coffee-orange.svg?longCache=true&style=flat-square
[coffee-link]: https://ko-fi.com/geraldyeo
[type-ts-badge]: https://img.shields.io/badge/typedef-.d.ts-blue.svg?style=flat-square&longCache=true
[type-ts-link]: https://github.com/yeojz/otplib/tree/master/packages/types-ts
[type-ts-file]: https://github.com/yeojz/otplib/blob/master/packages/types-ts/index.d.ts
