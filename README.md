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
- [Getting Started (Node.js)](#getting-started-nodejs)
  - [Install the package](#install-the-package)
  - [Choose a base32 module (for Google Authenticator)](#choose-a-base32-module-for-google-authenticator)
  - [Alternative: Using the UMD Module](#alternative-using-the-umd-module)
- [Getting Started (Browsers)](#getting-started-browsers)
  - [Adding the scripts](#adding-the-scripts)
  - [Browser bundle size](#browser-bundle-size)
- [Available Packages](#available-packages)
  - [Base](#base)
  - [Plugins](#plugins)
    - [Crypto](#crypto)
    - [Base 32](#base-32)
  - [Packages](#packages)
- [Available Options](#available-options)
- [Google Authenticator](#google-authenticator)
  - [Difference between Authenticator and TOTP](#difference-between-authenticator-and-totp)
  - [RFC3548 Base32](#rfc3548-base32)
  - [Displaying a QR code](#displaying-a-qr-code)
- [Others](#others)
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

### Features

- [x] Typescript support
- [x] [Class][mdn-classes] interfaces
- [x] [Function][mdn-functions] interfaces
- [x] Pluggable crypto modules
  - `crypto`
  - `cryptojs`
  - etc.
- [x] Pluggable base32 modules
  - `thirty-two`
  - `base32-encode` + `base32-decode`
  - etc.
- [x] Multi platform builds provided
  - `node`
  - `browser` ()
  - etc.

## Getting Started (Node.js)

### Install the package

```bash
npm install otplib
```

### Choose a base32 module (for Google Authenticator)

If you're using Google Authenticator, you'll need a base32 module for
encoding and decoding your secrets.

Currently out-of-box, 2 libraries are supported.
Install one of them and initialise `otplib` with the corresponding helpers.

```bash
# choose either
npm install thirty-two
# or
npm install base32-encode base32-decode
```

```js
import { authenticator } from 'otplib';

// for thirty-two
import { keyDecoder, keyEncoder } from 'otplib/base32/thirty-two';
// for base32-encode and base32-decode
import { keyDecoder, keyEncoder } from 'otplib/base32/base32-endec';

// Initialise your instance by
authenticator.options = { keyDecoder, keyEncoder };
// or
const instance = authenticator.clone({ keyDecoder, keyEncoder });
```

### Alternative: Using the UMD Module

As the browser module provided is bundled as an `umd` module,
you can also use it as a node package import, without having to install
any third party packages after doing `npm install otplib`.

```js
import * as otplib from 'otplib/browser';
// or const otplib = require('otplib/browser');
```

Do note that many of the node dependencies within the bundle were replaced with
browser shims.

## Getting Started (Browsers)

The browser module is a `umd` bundle with some node modules replaced to reduce the browser size.

The following defaults have been used:

- **crypto**: `crypto-js`
- **encoder**: `base32-encode`
- **decoder**: `base32-decode`

To see what is included, you can take a look at `packages/otplib-browser/index.ts`.

### Adding the scripts

```html
<script src="https://unpkg.com/otplib@^12.0.0/browser/buffer.js"></script>
<script src="https://unpkg.com/otplib@^12.0.0/browser/index.js"></script>

<script type="text/javascript">
  // window.otplib
</script>
```

There are 2 scripts required. The `browser/index.js` script as well as `browser/buffer.js`.

The `buffer.js` provided in by this library is a cached copy
from [https://www.npmjs.com/package/buffer](https://www.npmjs.com/package/buffer).
You can also download and include the latest version via their project page.

**Alternatively**, you can find the required files at `node_modules/otplib/browser/*`
after you `npm install otplib`.

### Browser bundle size

The approximate **bundle sizes** are as follows:

| Bundle Type                       | Size       |
| --------------------------------- | ---------- |
| original                          | 324KB      |
| original, minified + gzipped      | 102KB      |
| optimised                         | 28.3KB     |
| **optimised, minified + gzipped** | **9.12KB** |

Paired with the gzipped browser `buffer.js` module, it would be about `7.65KB + 9.12KB = 16.77KB`.

## Available Packages

This library has been split into 3 categories: `base`, `plugins` and `packages`.

### Base

These provides the main functionality of the library. However parts of the logic
has been separated out in order to provide flexibility to the library.

| file                 | description                        |
| -------------------- | ---------------------------------- |
| otplib/core          | HOTP and TOTP functionality        |
| otplib/authenticator | Google Authenticator functionality |

### Plugins

#### Crypto

| file                   | description               |
| ---------------------- | ------------------------- |
| otplib/crypto/node     | node crypto based methods |
| otplib/crypto/cryptojs | crypto-js based methods   |

#### Base 32

| file                       | description                                           |
| -------------------------- | ----------------------------------------------------- |
| otplib/base32/thirty-two   | Encoder/Decoder using thirty-two                      |
| otplib/base32/base32-endec | Encoder/Decoder using base32-encode and base32-decode |

### Packages

| file            | description                                                 |
| --------------- | ----------------------------------------------------------- |
| otplib/node     | Uses node crypto + thirty-two                               |
| otplib/cryptojs | Uses crypto-js + thirty-two                                 |
| otplib/browser  | Webpack bundle. Uses base32-endec + crypto-js               |
| otplib/legacy   | Wrapper to adapt the APIs to otplib@v11.x compatible format |

## Available Options

## Google Authenticator

### Difference between Authenticator and TOTP

The default encoding option has been set to `hex` (Authenticator) instead of `ascii` (TOTP).

### RFC3548 Base32

Google Authenticator requires keys to be base32 encoded.
It also requires the base32 encoder to be [RFC 3548][rfc-3548] compliant.

OTP calculation will still work should you want to use
other base32 encoding methods (like Crockford's Base32)
but it will NOT be compatible with Google Authenticator.

```js
const secret = authenticator.generateSecret(); // base32 encoded hex secret key
const token = authenticator.generate(secret);
```

### Displaying a QR code

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
import { authenticator } from 'otplib';

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

## Others

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

<!-- readmelinks -->

[badge-circle]: https://img.shields.io/circleci/project/github/yeojz/otplib/master.svg?style=flat-square
[badge-coffee]: https://img.shields.io/badge/%E2%98%95%EF%B8%8F-buy%20me%20a%20coffee-orange.svg?longCache=true&style=flat-square
[badge-coveralls]: https://img.shields.io/coveralls/yeojz/otplib/master.svg?style=flat-square
[badge-npm-downloads]: https://img.shields.io/npm/dt/otplib.svg?style=flat-square
[badge-npm-next]: https://img.shields.io/npm/v/otplib/next.svg?style=flat-square
[badge-npm]: https://img.shields.io/npm/v/otplib.svg?style=flat-square
[badge-pr-welcome]: https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square&longCache=true
[badge-type-ts]: https://img.shields.io/badge/typedef-.d.ts-blue.svg?style=flat-square&longCache=true
[mdn-classes]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes
[mdn-crypto]: https://developer.mozilla.org/en-US/docs/Web/API/Window/crypto
[mdn-functions]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions
[mdn-uint8array]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array
[project-circle]: https://circleci.com/gh/yeojz/otplib
[project-coffee]: https://paypal.me/yeojz
[project-coveralls]: https://coveralls.io/github/yeojz/otplib
[project-docs]: https://otplib.yeojz.com/docs
[project-npm]: https://www.npmjs.com/package/otplib
[project-pr-welcome]: https://github.com/yeojz/otplib/blob/master/CONTRIBUTING.md
[project-web]: https://otplib.yeojz.com
[rfc-3548]: http://tools.ietf.org/html/rfc3548
[rfc-4226-dataset]: https://github.com/yeojz/otplib/blob/master/packages/tests-data/rfc4226.ts
[rfc-4226-wiki]: http://en.wikipedia.org/wiki/HMAC-based_One-time_Password_Algorithm
[rfc-4226]: http://tools.ietf.org/html/rfc4226
[rfc-6238-dataset]: https://github.com/yeojz/otplib/blob/master/packages/tests-data/rfc6238.ts
[rfc-6238-wiki]: http://en.wikipedia.org/wiki/Time-based_One-time_Password_Algorithm
[rfc-6238]: http://tools.ietf.org/html/rfc6238

<!-- /readmelinks -->
