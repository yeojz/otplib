# otplib
Time-based (TOTP) and HMAC-based (HOTP) One-Time Password library

[![npm](https://img.shields.io/npm/v/metalsmith-react-templates.svg)](https://www.npmjs.com/package/metalsmith-react-templates)
[![Build Status](https://img.shields.io/travis/yeojz/otplib.svg)](https://travis-ci.org/yeojz/otplib)


- [`API`](/API.md)
- [`Changelog`](/CHANGELOG.md)
- [`License`](/LICENSE.md)




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

While this package is primarily a `node.js` module, a browser-based version which is compiled using `browserify` can be found in `bin/otplib.js`. 


### node.js
```javascript
var otplib = require('otplib');
```

### browser
```html
<script src="bin/otplib.js"></script>

<script type="text/javascript">
   var otplib = require('otplib');
</script>
```







## Quick Start

### Token Generation
```javascript
var otplib = require('otplib');

// Basic
var secret = otplib.core.secret.generate(); //'user secret'

// Generating OTP
var code = otplib.core.totp(secret);

console.log('OTP: ' + code);
```


### Token Validation

```javascript
var otplib = require('otplib');

// From database etc.
var secret = 'user secret',
    code = 'user provided OTP';

// True / False
var status = otplib.core.token.check(code, secret, 'totp');

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
var otplib = require('otplib');

var secret = otplib.google.secret(), //'base 32 encoded user secret'
    qrcode = otplib.google.qrcode('user@domain', 'service', secret);

var code = otplib.google.generate(secret);

console.log('OTP: ' + code);
```









