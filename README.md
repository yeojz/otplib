# otplib
Time-based (TOTP) and HMAC-based (HOTP) One-Time Password library

[![npm](https://img.shields.io/npm/v/otplib.svg?style=flat-square)](https://www.npmjs.com/package/otplib)
[![Build Status](https://img.shields.io/travis/yeojz/otplib.svg?style=flat-square)](https://travis-ci.org/yeojz/otplib)


- [`API`](https://yeojz.github.io/otplib/docs)
- [`Changelog`](https://github.com/yeojz/otplib/wiki/CHANGELOG)
- [`License`](https://github.com/yeojz/otplib/blob/master/LICENSE.md)




## About

`otplib` is a JavaScript One Time Password (OTP) Library. 

It was initially created for me to understand how One Time Passwords work in implementation.


It implements:

 * [RFC 4226](http://tools.ietf.org/html/rfc4226) - [HOTP](http://en.wikipedia.org/wiki/HMAC-based_One-time_Password_Algorithm)
 * [RFC 6238](http://tools.ietf.org/html/rfc6238) - [TOTP](http://en.wikipedia.org/wiki/Time-based_One-time_Password_Algorithm)

This library is compatible with [Google Authenticator](http://code.google.com/p/google-authenticator/), and includes additional
methods to allow you to easily work with Google Authenticator.







## Installation
Install the module via `npm`

```
 $ npm install otplib
```









## Usage

While this package is primarily a `node.js` module, you can also use it within the browser


### node.js

There are serveral variants:
```javascript

// {hotp, totp, authenticator} object
var otplib = require('otplib');

// Authenticator only
var otplib = require('otplib/authenticator');

// HOTP only
var otplib = require('otplib/hotp');

// TOTP only
var otplib = require('otplib/totp');

```

### browser
```html
<script src="public/lib/otplib.js"></script>

<script type="text/javascript">
   var otplib = require('otplib');
</script>
```







## Quick Start

### Token Generation
```javascript
var totp = require('otplib/totp');

// Basic
var secret = totp.utils.generateSecret(); //'user secret'

// Generating OTP
var code = totp.generate(secret);

console.log('OTP: ' + code);
```


### Token Validation

```javascript
var totp = require('otplib/totp');

// From database etc.
var secret = 'user secret';
var code = 'user provided OTP';

// True / False
var status = totp.check(code, secret);

console.log('Is Token Valid: ' + status);
```








## Note on Google Authenticator

### Base32 Keys

Google Authenticator requires keys to be base32 encoded.

### RFC3548

Google Authenticator requires an [RFC 3548](http://tools.ietf.org/html/rfc3548) compliant encoder.

OTP calculation will still work should you want to use other base32 encoding methods (like Crockford's Base 32)
but it will NOT be compatible with Google Authenticator.

### Sample

```javascript
var authenticator = require('otplib/authenticator');

var secret = authenticator.generateSecret(); //'base 32 encoded user secret'
var qrcode = authenticator.qrcode('user@domain', 'service', secret);

var code = authenticator.generate(secret);

console.log('OTP: ' + code);
```



