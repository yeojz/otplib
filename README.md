# otplib
Time-based (TOTP) and HMAC-based (HOTP) One-Time Password library


## About

otplib is another node based One Time Password (OTP) Library.
It was initially created for me to understand how One Time Passwords work in implementation.

It implements:

 * [RFC 4226](http://tools.ietf.org/html/rfc4226) - [HOTP](http://en.wikipedia.org/wiki/HMAC-based_One-time_Password_Algorithm)
 * [RFC 6238](http://tools.ietf.org/html/rfc6238) - [TOTP](http://en.wikipedia.org/wiki/Time-based_One-time_Password_Algorithm)

This library is compatible with [Google Authenticator](http://code.google.com/p/google-authenticator/), and includes additional
methods to allow you to easily work with Google Authenticator


## Getting Started
Install the module with: `npm install otplib`

```javascript
var otplib = require('otplib');
```

## Sample Usage


###Token Generation
```javascript
var otplib = require('otplib');


// Basic
var secret = 'user secret' || otp.core.secret(),
    qrcode = otp.core.qrcode('user', 'domain', secret);

// Generating OTP
var code = otp.core.totp(secret);

```





###Token Validation

```javascript
var otplib = require('otplib');

var secret = 'user secret', // From database etc.
    code = 'user input one time pass';

// True / False
var status = otp.google.check(code, secret);

```




## Google Authenticator

### Base32 Keys

Google Authenticator requires keys to be base32 encoded.

### RFC3548

Google Authenticator requires an [RFC 3548](http://tools.ietf.org/html/rfc3548) compliant encoder.

OTP calculation will still work should you want to use other base32 encoding methods (like Crockford's Base 32)
but it will NOT be compatible with Google Authenticator.

### Sample

```javascript
var otplib = require('otplib');


var secret = 'base 32 encoded user secret' || otp.google.secret(),
    qrcode = otp.core.qrcode('user', 'domain', secret);


var code = otp.google.generate(secret);

```


## Documentation

_(TO BE UPDATED)_



## Release History

 * 0.0.1 - First Release



## License
Copyright (c) 2014 Gerald Yeo. Licensed under the MIT license.
