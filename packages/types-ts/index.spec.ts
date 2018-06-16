import * as otplib from 'otplib';
import authenticator = require('otplib/authenticator');
import core = require('otplib/core');
import hotp = require('otplib/hotp');
import totp = require('otplib/totp');

const SECRET = '1234567890';
let secret = '';
let token = '';

secret = otplib.authenticator.generateSecret(20); // $ExpectType string
token = otplib.authenticator.generate(secret); // $ExpectType string

otplib.authenticator.check(token, secret); // $ExpectType boolean
otplib.authenticator.checkDelta(token, secret); // $ExpectType number | null
otplib.authenticator.decode('test'); // $ExpectType string
otplib.authenticator.encode('test'); // $ExpectType string
otplib.authenticator.verify({ secret, token }); // $ExpectType boolean
otplib.authenticator.keyuri('me', 'otplib-test', secret); // $ExpectType string
otplib.authenticator.timeRemaining(); // $ExpectType number
otplib.authenticator.timeUsed(); // $ExpectType number
otplib.authenticator.Authenticator;
otplib.authenticator.getClass();
authenticator.check(token, secret); // $ExpectType boolean
authenticator.checkDelta(token, secret); // $ExpectType number | null
authenticator.decode('test'); // $ExpectType string
authenticator.encode('test'); // $ExpectType string
authenticator.verify({ secret, token }); // $ExpectType boolean
authenticator.keyuri('me', 'otplib-test', secret); // $ExpectType string
authenticator.timeRemaining(); // $ExpectType number
authenticator.timeUsed(); // $ExpectType number
authenticator.Authenticator;
authenticator.getClass();

token = otplib.totp.generate(SECRET); // $ExpectType string
otplib.totp.check(token, SECRET); // $ExpectType boolean
otplib.totp.checkDelta(token, SECRET); // $ExpectType number | null
otplib.totp.verify({ secret: SECRET, token }); // $ExpectType boolean
otplib.totp.timeRemaining(); // $ExpectType number
otplib.totp.timeUsed(); // $ExpectType number
otplib.totp.TOTP;
otplib.totp.getClass();
totp.check(token, SECRET); // $ExpectType boolean
totp.checkDelta(token, SECRET); // $ExpectType number | null
totp.verify({ secret: SECRET, token }); // $ExpectType boolean
totp.timeRemaining(); // $ExpectType number
totp.timeUsed(); // $ExpectType number
totp.TOTP;
totp.getClass();

token = otplib.hotp.generate(SECRET, 1); // $ExpectType string
otplib.hotp.check(token, SECRET, 1); // $ExpectType boolean
otplib.hotp.verify({ secret: SECRET, token, counter: 1 }); // $ExpectType boolean
otplib.hotp.HOTP;
otplib.hotp.getClass();
hotp.check(token, SECRET, 1); // $ExpectType boolean
hotp.verify({ secret: SECRET, token, counter: 1 }); // $ExpectType boolean
hotp.HOTP;
hotp.getClass();

const hotpOpt = core.hotpOptions({});
core.hotpCheck('123', SECRET, 0, hotpOpt); // $ExpectType boolean
core.hotpCounter(0); // $ExpectType string
core.hotpDigest(SECRET, 0, hotpOpt); // $ExpectType string
core.hotpSecret(SECRET, { algorithm: hotpOpt.algorithm, encoding: hotpOpt.encoding }); // $ExpectType Buffer
core.hotpToken(SECRET, 0, hotpOpt); // $ExpectType string

const totpOpt = core.totpOptions({});
core.totpCheck('123', SECRET, totpOpt); // $ExpectType boolean
core.totpCheckWithWindow('123', SECRET, totpOpt); // $ExpectType number | null
core.totpCounter(new Date().valueOf(), 0); // $ExpectType number
core.totpSecret(SECRET, { algorithm: totpOpt.algorithm, encoding: totpOpt.encoding }); // $ExpectType Buffer
core.totpToken(SECRET, totpOpt); // $ExpectType string
core.totpTimeRemaining(1, 1);  // $ExpectType number
core.totpTimeUsed(1, 1);  // $ExpectType number
