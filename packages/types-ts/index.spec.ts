import * as otplib from 'otplib';
import authenticator = require('otplib/authenticator');
import hotp = require('otplib/hotp');
import totp = require('otplib/totp');

const SECRET = '1234567890';
let secret = '';
let token = '';

secret = otplib.authenticator.generateSecret(20);
token = otplib.authenticator.generate(secret);

otplib.authenticator.check(token, secret); // $ExpectType boolean
otplib.authenticator.checkDelta(token, secret); // $ExpectType number | null
otplib.authenticator.decode('test'); // $ExpectType string
otplib.authenticator.encode('test'); // $ExpectType string
otplib.authenticator.verify({ secret, token }); // $ExpectType boolean
otplib.authenticator.keyuri('me', 'otplib-test', secret); // $ExpectType string
otplib.authenticator.Authenticator;
otplib.authenticator.getClass();
authenticator.check(token, secret); // $ExpectType boolean
authenticator.checkDelta(token, secret); // $ExpectType number | null
authenticator.decode('test'); // $ExpectType string
authenticator.encode('test'); // $ExpectType string
authenticator.verify({ secret, token }); // $ExpectType boolean
authenticator.keyuri('me', 'otplib-test', secret); // $ExpectType string
authenticator.Authenticator;
authenticator.getClass();

token = otplib.totp.generate(SECRET);
otplib.totp.check(token, SECRET); // $ExpectType boolean
otplib.totp.checkDelta(token, SECRET); // $ExpectType number | null
otplib.totp.verify({ secret: SECRET, token }); // $ExpectType boolean
otplib.totp.TOTP;
otplib.totp.getClass();
totp.check(token, SECRET); // $ExpectType boolean
totp.checkDelta(token, SECRET); // $ExpectType number | null
totp.verify({ secret: SECRET, token }); // $ExpectType boolean
totp.TOTP;
totp.getClass();

token = otplib.hotp.generate(SECRET, 1);
otplib.hotp.check(token, SECRET, 1); // $ExpectType boolean
otplib.hotp.verify({ secret: SECRET, token, counter: 1 }); // $ExpectType boolean
otplib.hotp.HOTP;
otplib.hotp.getClass();
hotp.check(token, SECRET, 1); // $ExpectType boolean
hotp.verify({ secret: SECRET, token, counter: 1 }); // $ExpectType boolean
hotp.HOTP;
hotp.getClass();
