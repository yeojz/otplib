# otplib

> Time-based (TOTP) and HMAC-based (HOTP) One-Time Password library

[![npm][npm-badge]][npm-link]
[![Build Status][circle-badge]][circle-link]
[![Coverage Status][coveralls-badge]][coveralls-link]
[![PRs Welcome][pr-welcome-badge]][pr-welcome-link]

## Table of Contents

-   [About](#about)
-   [Installation](#installation)
-   [Getting Started](#getting-started)
    -   [Using in node](#in-node)
    -   [Using in browser](#in-browser)
-   [Advanced Usage](#advanced-usage)
-   [Google Authenticator](#google-authenticator)
-   [Documentation](https://yeojz.github.io/otplib/docs)
-   [Demo](https://yeojz.github.io/otplib)
-   [Related](#related)

## About

`otplib` is a JavaScript One Time Password (OTP) library. It provides both `functions` and `classes`
for dealing with OTP generation and verification.

It was initially created for me to understand how One Time Passwords work in implementation.

It implements:

-   [RFC 4226](http://tools.ietf.org/html/rfc4226) - [HOTP](http://en.wikipedia.org/wiki/HMAC-based_One-time_Password_Algorithm)
-   [RFC 6238](http://tools.ietf.org/html/rfc6238) - [TOTP](http://en.wikipedia.org/wiki/Time-based_One-time_Password_Algorithm)

The implementations provided here are tested against test vectors provided in their respective RFC specifications. These datasets can be found in the `tests/helpers` folder.

-   [RFC 4226 Dataset](https://github.com/yeojz/otplib/blob/master/4.0.0/tests/helpers/rfc4226.js)
-   [RFC 6238 Dataset](https://github.com/yeojz/otplib/blob/master/tests/helpers/rfc6238.js)

This library is also compatible with [Google Authenticator](https://github.com/google/google-authenticator), and includes additional methods to allow you to easily work with Google Authenticator.


## Installation

Install the library via:

```
$ npm install otplib --save
```

or

```
$ yarn add otplib
```

## Getting Started

### In node

```js
import otplib from 'otplib'; // exposes an object with all supported OTP classes
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

Do note that if you're using `require`, you will need to do `var otplib = require('otplib').default` as the sources are compiled with [babel](https://github.com/babel/babel)

### In browser

Compiled versions of the library are also available .
You'll need to add the following scripts to your code:

```html

<!-- required: common lib -->
<script src="otplib.common.js"></script>

<!--
Available files:
-   otplib.js           (hotp / totp / google authenticator)
-   otplib.hotp.js      (hotp)
-   otplib.totp.js      (totp)
-   otplib.ga.js        (google authenticator)
-   otplib.otputils.js  (utilites)
-   otplib.legacy.js    (v2 interface)
-->
<script src="otplib.js"></script> // can replace with available files above

<script type="text/javascript">
   // window.otplib etc.
</script>
```

## Advanced Usage

By default, classes are provided to wrap functionalities and methods into logical groups.
However, they are ultimately just syntax-sugar to the underlying functional steps in OTP generation.

If you prefer a more functional approach compared to classes, you may import them
from their respective folders.

-   `functions` can be found in `otplib/core/<FILENAME>`
-   `classes` can be found in `otplib/classes/<FILENAME>`
-   `utils` can be found in `otplib/utils/<FILENAME>`

For more information about the methods and available files, check out the [documentation](https://yeojz.github.io/otplib/docs).

## Google Authenticator

__Base32 Keys and RFC3548__

Google Authenticator requires keys to be base32 encoded.
It also requires the base32 encoder to be [RFC 3548](http://tools.ietf.org/html/rfc3548) compliant.

OTP calculation will still work should you want to use other base32 encoding methods (like Crockford's Base 32) but it will NOT be compatible with Google Authenticator.

```js
import authenticator from 'otplib/authenticator';

const secret = authenticator.generateSecret(); // base 32 encoded user secret key
const token = authenticator.generate(secret);
```

## Related

-   [otplib-cli](https://www.github.com/yeojz/otplib-cli) - Command-line OTP

## License

`otplib` is [MIT licensed](./LICENSE)

[npm-badge]: https://img.shields.io/npm/v/otplib.svg?style=flat-square
[npm-link]: https://www.npmjs.com/package/otplib

[circle-badge]: https://img.shields.io/circleci/project/github/yeojz/otplib/master.svg?style=flat-square
[circle-link]: https://circleci.com/gh/yeojz/otplib.svg

[coveralls-badge]: https://img.shields.io/coveralls/yeojz/otplib/master.svg?style=flat-square
[coveralls-link]: https://coveralls.io/github/yeojz/otplib

[pr-welcome-badge]: https://img.shields.io/badge/PRs-Welcome-ff69b4.svg?style=flat-square
[pr-welcome-link]: https://github.com/yeojz/otplib/blob/master/CONTRIBUTING.md
