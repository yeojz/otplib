import * as otplib from 'otplib';

const secret = '1234567890';

const aSecret = otplib.authenticator.generateSecret(20);
const aToken = otplib.authenticator.generate(aSecret);

otplib.authenticator.check(aToken, aSecret); // $ExpectType boolean
otplib.authenticator.checkDelta(aToken, aSecret); // $ExpectType number | null
otplib.authenticator.decode('test'); // $ExpectType string
otplib.authenticator.encode('test'); // $ExpectType string
otplib.authenticator.verify({ secret: aSecret, token: aToken }); // $ExpectType boolean
otplib.authenticator.keyuri('me', 'otplib-test', aSecret); // $ExpectType string

const tToken = otplib.totp.generate(secret);

otplib.totp.check(tToken, secret); // $ExpectType boolean
otplib.totp.checkDelta(tToken, secret); // $ExpectType number | null
otplib.totp.verify({ secret, token: tToken }); // $ExpectType boolean

const hToken = otplib.hotp.generate(secret, 1);
otplib.hotp.check(hToken, secret, 1); // $ExpectType boolean
otplib.hotp.verify({ secret, token: hToken, counter: 1 }); // $ExpectType boolean
