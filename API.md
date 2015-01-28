# API Documentation

All examples assumes `var otplib = require('otplib');` as the base.



### `otplib.core.METHOD` - Core


--

HMAC based OTP

#### `.hotp(secret, counter)` 

  * `secret` (_**string**_) _user secret_
  * `counter` (_**integer**_) 
  
--

Time based OTP

#### `.totp(secret)`

  * `secret` (_**string**_) _user secret_

--
HOTP Check

#### `.checkHOTP(token, secret, counter)` 


 * `token` (_**string**_) _user provided one time pass_
 * `secret` (_**string**_) _user secret_
 * `counter` (_**string**_) 

-- 

TOTP Check

#### `.checkTOTP(token, secret)` 


 * `token` (_**string**_) _user provided one time pass_
 * `secret` (_**string**_) _user secret_

--

Generate a random secret

##### `.secret.generate(length)` 

 * length (_**integer**_) [optional, default: _16_]


--

Removes all spaces from specified secret

#### `.secret.removeSpaces(secret)`

  * `secret` (_**string**_) _user secret_

--
  
Divides a string into sets according to the specified number

#### `.secret.divideIntoSetsOf(num, secret)` 

  * `num` (_**integer**_) _number of characters in a set_
  * `secret` (_**string**_) _user secret_

-- 


Converts String to Hex

#### `.helpers.stringToHex(value)` 

  * `value` (_**string**_)

--

Converts Hex into an Integer

#### `.helpers.hexToInt(hex)`

 * `hex` (_**string**_) _hexadecimal string_

--

Parse number into an Integer and convert to Hex

#### `helpers.intToHex(number)` 

 * `number` (_**string/integer**_) _parseInt(base 10) will be called on the number_

--

Do a left padding of the value based on the total

#### `helpers.pad(value, total)` 

 * `value` (_**string**_) _string to pad_
 * `total` (_**string**_) _total number of characters in string_

--


### `otplib.google.METHOD` - Google Authenticator 
--

Sets debug message printouts

#### `.debug(status)` 

 * `status` (_**boolean**_) _true/false_

--

Generate a secret

#### `.secret(length)` 

 * length (_**integer**_) [optional, default: _16_] 


--

otpauth://totp/service:user?secret=NKEIBAOUFA&issuer=service

#### `.keyuri(user, service, secret)` 

 * `user` (_**string**_) _eg. joe@localhost_
 * `service` (_**string**_) _eg. MyService_
 * `secret` (_**string**_) _user secret_

--

Generates a QR Code image using Google Charts

`.qrcode(user, service, secret)` 

 * `user` (_**string**_) _eg. joe@localhost_
 * `service` (_**string**_) _eg. MyService_
 * `secret` (_**string**_) _user secret_


--

Generate One Time Pass

#### `.generate(secret)` 

 * `secret` (_**string**_) _user secret_


--

Check for token validity

#### `.check(token, secret)` 

 * `token` (_**string**_) _user provided one time pass_
 * `secret` (_**string**_) _user secret_


--

Base32 encoding

#### `.encode(secret, type)` 

 * `secret` (_**string**_) _user secret_
 * `type` (_**string**_) [optional, default: _binary_] _encoding: binary, utf8, ascii_

-- 

Base32 decoding

#### `.decode(secret, type)` 

 * `secret` (_**string**_) _user secret_
 * `type` (_**string**_) [optional, default: _binary_] _encoding: binary, utf8, ascii_ 

