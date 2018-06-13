import hotp from 'otplib-hotp';
import totp from 'otplib-totp';
import authenticator from 'otplib-authenticator';
import crypto from 'crypto';

/**
 * otplib
 *
 * One-Time Password Library
 *
 * ```js
 * {
 *    authenticator // instance
 *    hotp // instance
 *    totp // instance
 * }
 * ```
 *
 * @module otplib
 * @since 3.0.0
 */
authenticator.options = { crypto };
hotp.options = { crypto };
totp.options = { crypto };

export { authenticator, hotp, totp };
