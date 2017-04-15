# otplib

> Time-based (TOTP) and HMAC-based (HOTP) One-Time Password library

[![npm][npm-badge]][npm-link]
[![Build Status][circle-badge]][circle-link]
[![Coverage Status][coveralls-badge]][coveralls-link]
[![npm downloads][npm-downloads-badge]][npm-link]
[![PRs Welcome][pr-welcome-badge]][pr-welcome-link]

<img width="150" src="https://yeojz.github.io/otplib/otplib.png" />

## Table of Contents

-   [About](#about)
-   [Installation](#installation)
-   [Getting Started](#getting-started)
    -   [Using in node](#in-node)
    -   [Using in browser](#in-browser)
-   [Notes](#notes)
    -   [Setting custom options](#setting-custom-options)
    -   [Google Authenticator](#google-authenticator)
    -   [Browser Compatibility](#browser-compatibility)
-   [Advanced Usage](#advanced-usage)
-   [Documentation][project-docs]
-   [Demo][project-web]
-   [Contributing][pr-welcome-link]
-   [Related](#related)

## About

`otplib` is a JavaScript One Time Password (OTP) library. It provides both `functions` and `classes`
for dealing with OTP generation and verification.

It was initially created for me to understand how One Time Passwords work in implementation.

It implements:

-   [RFC 4226][rfc-4226] - [HOTP](http://en.wikipedia.org/wiki/HMAC-based_One-time_Password_Algorithm)
-   [RFC 6238][rfc-6238] - [TOTP](http://en.wikipedia.org/wiki/Time-based_One-time_Password_Algorithm)

The implementations provided here are tested against test vectors provided in their respective RFC specifications. These datasets can be found in the `tests/helpers` folder.

-   [RFC 4226 Dataset](https://github.com/yeojz/otplib/blob/master/tests/helpers/rfc4226.js)
-   [RFC 6238 Dataset](https://github.com/yeojz/otplib/blob/master/tests/helpers/rfc6238.js)

This library is also compatible with [Google Authenticator](https://github.com/google/google-authenticator), and includes additional methods to allow you to work with Google Authenticator.

## Installation

Install the library via:

```
$ npm install otplib --save
```

or

```
$ yarn add otplib
```

## Upgrading

This library follows `semver`. As such, major version bumps usually mean API changes or behavior changes. Please check [upgrade notes](https://github.com/yeojz/otplib/wiki/upgrade-notes) for more information, especially before making any major upgrades.

You might also want to check out the release notes associated with each tagged versions in the [releases](https://github.com/yeojz/otplib/releases) page.

## Getting Started

### In node

```js
import otplib from 'otplib';

const secret = otplib.authenticator.generateSecret();

const token = otplib.authenticator.generate(secret);

const isValid = otplib.authenticator.check(123456, secret);

// or

const isValid = otplib.authenticator.verify({
  secret,
  token: 123456
});

```

If you want to include a specific OTP specification, you can import it directly:

```js
import hotp from 'otplib/hotp';
import totp from 'otplib/totp';
import authenticator from 'otplib/authenticator';
```

For ease of use, the default exports are all instantiated instances of their respective classes.
You may access the original classes via:

```js
import {HOTP} from 'otplib/hotp';
import {TOTP} from 'otplib/totp';
import {Authenticator} from 'otplib/authenticator';
```

Do note that if you're using `require`, you will need to do `const otplib = require('otplib').default` as the sources are compiled with [babel](https://github.com/babel/babel). Alternatively, the library provides ES5 compat files for some of the main entry points to the library. i.e.

```js
const otplib = require('otplib').default;
const totp = require('otplib/totp').default;

// same as

const otplib = require('otplib/compat');
const totp = require('otplib/compat/totp');
```

All these can be found in the `compat` folder.

### In browser

Compiled versions of the library are also available, which can be useful for quick proof-of-concepts or even login implementations like  WhatsApp / Line etc.

You'll need to add the following scripts to your code:

```html
<!-- required: common lib -->
<script src="otplib_common.js"></script>

<!-- replace with any of the available files below -->
<script src="otplib.js"></script>

<script type="text/javascript">
   // window.otplib or window.otplib_hotp etc
</script>
```

__Available files:__

-   `otplib.js`           - (hotp / totp / google authenticator)
-   `otplib_hotp.js`      - (hotp)
-   `otplib_totp.js`      - (totp)
-   `otplib_ga.js`        - (google authenticator)
-   `otplib_otputils.js`  - (utilites)
-   `otplib_legacy.js`    - (v2 interface)

You can find these files in `node_modules/otplib/dist` after you install.
Alternatively, you can get the latest [here](https://github.com/yeojz/otplib/tree/gh-pages/lib).

For a live example, the [project site][project-web] has been built using `otplib.js`. The source code can be found [here](https://github.com/yeojz/otplib/tree/master/site).

## Notes

### Setting custom options

#### Class

All instantiated classes will have their options inherited from their respective options generator. i.e. HOTP from `hotpOptions` and TOTP/Authenticator from `totpOptions`.

All OTP classes have an object setter and getter method to override these default options.

For example,

```js
import otplib from 'otplib';

// setting
otplib.authenticator.options = {
   step: 30
}

// getting
const opts = otplib.authenticator.options;
```

#### Methods

Most of the core methods take in an object `options` as their last argument.


### Google Authenticator

__Base32 Keys and RFC3548__

Google Authenticator requires keys to be base32 encoded.
It also requires the base32 encoder to be [RFC 3548][rfc-3548] compliant.

OTP calculation will still work should you want to use other base32 encoding methods (like Crockford's Base 32) but it will NOT be compatible with Google Authenticator.

```js
import authenticator from 'otplib/authenticator';

const secret = authenticator.generateSecret(); // base 32 encoded user secret key
const token = authenticator.generate(secret);
```

### Browser Compatibility

In order to reduce the size of the browser package, the `crypto` package has been replaced with a alternative implementation. The current implementation depends on [Uint8Array][mdn-uint8array] and the browser's native [crypto][mdn-crypto] methods, which may only be available in recent browser versions.

To find out more about the replacements, you can take a look at `src/utils/crypto.js`

__Output sizes:__

-   with node crypto: ~311Kb
-   with alternative crypto: ~94.2Kb

If you prefer to use node's `crypto` module instead, you can set the environment variable `OTPLIB_WEBPACK_USE_NODE_CRYPTO=true` and rebuild the browser distribution.

i.e. `OTPLIB_WEBPACK_USE_NODE_CRYPTO=true npm run build:dist`

## Advanced Usage

By default, classes are provided to wrap functionalities and methods into logical groups.
However, they are ultimately just syntax-sugar to the underlying functional steps in OTP generation.

If you prefer a more functional approach compared to classes, you may import them
from their respective folders.

-   `functions` can be found in `otplib/core/<FILENAME>`
-   `classes` can be found in `otplib/classes/<FILENAME>`
-   `utils` can be found in `otplib/utils/<FILENAME>`

For more information about the methods and available files, check out the [documentation][project-docs].

## Related

-   [otplib-cli](https://www.github.com/yeojz/otplib-cli) - Command-line OTP

## License

`otplib` is [MIT licensed](./LICENSE)

[npm-badge]: https://img.shields.io/npm/v/otplib.svg?style=flat-square
[npm-link]: https://www.npmjs.com/package/otplib
[npm-downloads-badge]: https://img.shields.io/npm/dt/otplib.svg?style=flat-square

[circle-badge]: https://img.shields.io/circleci/project/github/yeojz/otplib/master.svg?style=flat-square
[circle-link]: https://circleci.com/gh/yeojz/otplib

[coveralls-badge]: https://img.shields.io/coveralls/yeojz/otplib/master.svg?style=flat-square
[coveralls-link]: https://coveralls.io/github/yeojz/otplib

[pr-welcome-badge]: https://img.shields.io/badge/PRs-Welcome-ff69b4.svg?style=flat-square
[pr-welcome-link]: https://github.com/yeojz/otplib/blob/master/CONTRIBUTING.md

[mdn-uint8array]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array
[mdn-crypto]: https://developer.mozilla.org/en-US/docs/Web/API/Window/crypto

[project-web]: https://yeojz.github.io/otplib
[project-docs]: https://yeojz.github.io/otplib/docs

[rfc-4226]: http://tools.ietf.org/html/rfc4226
[rfc-6238]: http://tools.ietf.org/html/rfc6238
[rfc-3548]: http://tools.ietf.org/html/rfc3548
