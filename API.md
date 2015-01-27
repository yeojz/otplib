# API Documentation

All examples assumes `var otplib = require('otplib');` as the base.

## Methods


### Core - `otplib.core.METHOD`

#### `hotp(secret, counter)` - HMAC based OTP

  * `secret` (_**string**_) _user secret_
  * `counter` (_**integer**_)



#### `totp(secret)` - Time based OTP

  * `secret` (_**string**_) _user secret_



#### `secret.generate(length)` -  Generate a random secret

 * length (_**integer**_) [optional, default: _16_]


#### `secret.removeSpaces(secret)` - Removes all spaces from specified secret

  * `secret` (_**string**_) _user secret_
  
#### `secret.divideIntoSetsOf(num, secret)` - Divides a string into sets according to the specified number

  * `num` (_**integer**_) _number of characters in a set_
  * `secret` (_**string**_) _user secret_


#### `token.check(token, secret, type, counter)` - Simple checking method for token

 * `token` (_**string**_) _user provided one time pass_
 * `secret` (_**string**_) _user secret_
 * `type` (_**string**_) _'hotp' or 'totp'_
 * `counter` (_**string**_) [optional] _required for hotp_ 



#### `helpers.stringToHex(value)` - Converts String to Hex

  * `value` (_**string**_)



#### `helpers.hexToInt(hex)` - Converts Hex into an Integer

 * `hex` (_**string**_) _hexadecimal string_



#### `helpers.intToHex(number)` - Parse number into an Integer and convert to Hex

 * `number` (_**string/integer**_) _parseInt(base 10) will be called on the number_



#### `helpers.pad(value, total)` - Do a left padding of the value based on the total

 * `value` (_**string**_) _string to pad_
 * `total` (_**string**_) _total number of characters in string_




## GoogleAuthenticator - `otplib.google.METHOD`

### `debug(status)` - Sets debug message printouts

 * `status` (_**boolean**_) _true/false_



#### `secret(length)` - Generate a secret

 * length (_**integer**_) [optional, default: _16_] 



#### `keyuri(user, service, secret)` - otpauth://totp/service:user?secret=NKEIBAOUFA&issuer=service_


 * `user` (_**string**_) _eg. joe@localhost_
 * `service` (_**string**_) _eg. MyService_
 * `secret` (_**string**_) _user secret_


`qrcode(user, service, secret)` - Generates a QR Code image using Google Charts

 * `user` (_**string**_) _eg. joe@localhost_
 * `service` (_**string**_) _eg. MyService_
 * `secret` (_**string**_) _user secret_



#### `generate(secret)` - Generate One Time Pass


 * `secret` (_**string**_) _user secret_



#### `check(token, secret)` - Check for token validity

 * `token` (_**string**_) _user provided one time pass_
 * `secret` (_**string**_) _user secret_



#### `encode(secret, type)` - Base32 encoding

 * `secret` (_**string**_) _user secret_
 * `type` (_**string**_) [optional, default: _binary_] _encoding: binary, utf8, ascii_



#### `decode(secret, type)` - Base32 decoding

 * `secret` (_**string**_) _user secret_
 * `type` (_**string**_) [optional, default: _binary_] _encoding: binary, utf8, ascii_ 

