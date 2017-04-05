# otplib
Time-based (TOTP) and HMAC-based (HOTP) One-Time Password library

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
-   [Notes](#notes)
    -   [Google Authenticator compatibility](#google-authenticator-compatibility)

## About

`otplib` is a JavaScript One Time Password (OTP) Library.

It was initially created for me to understand how One Time Passwords work in implementation.

It implements:

-   [RFC 4226](http://tools.ietf.org/html/rfc4226) - [HOTP](http://en.wikipedia.org/wiki/HMAC-based_One-time_Password_Algorithm)
-   [RFC 6238](http://tools.ietf.org/html/rfc6238) - [TOTP](http://en.wikipedia.org/wiki/Time-based_One-time_Password_Algorithm)

This library is compatible with [Google Authenticator](http://code.google.com/p/google-authenticator/), and includes additional methods to allow you to easily work with Google Authenticator.

## Installation

Install the library:

```
npm install otplib --save

// or

yarn add otplib
```

## Getting Started

### In node

Valid module entry points:

```js

import otplib from 'otplib'; // otplib = {authenticator, hotp, totp}
import hotp from 'otplib/hotp'; // hotp
import totp from 'otplib/totp'; // hotp
import authenticator from 'otplib/authenticator'; // google authenticator
```

Do note that if you're using `require`, you may need to do `var otplib = require('otplib').default`.

### In browser

Compiled versions of the library will be available site.

You can just add to your head

```html
<script src="otplib.js"></script>

<script type="text/javascript">
   // window.otplib.hotp;
</script>
```

The following files are available:

-   [otplib.min.js]() - hotp / totp / google authenticator
-   [otplib.hotp.min.js]() - hotp
-   [otplib.totp.min.js]() - totp
-   [otplib.ga.min.js]() - google authenticator
-   [otplib.legacy.min.js]() - v2 interface


## CLI Usage

## Notes

### Google Authenticator compatibility

__Base32 Keys and RFC3548__

Google Authenticator requires keys to be base32 encoded.
It also requires the base32 encoder to be [RFC 3548](http://tools.ietf.org/html/rfc3548) compliant.

OTP calculation will still work should you want to use other base32 encoding methods (like Crockford's Base 32)
but it will NOT be compatible with Google Authenticator.

```js
import authenticator from 'otplib/authenticator';

const secret = authenticator.generateSecret(); // base 32 encoded user secret key
const token = authenticator.generate(secret);
```

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
