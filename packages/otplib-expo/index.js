import hotp from "otplib-hotp";
import totp from "otplib-totp";
import authenticator from "otplib-authenticator";
import crypto from "./crypto";

/**
 * otplib-expo
 *
 * One-Time Password Library for expo
 *
 * @module otplib-expo
 */
authenticator.options = { crypto };
hotp.options = { crypto };
totp.options = { crypto };

module.exports = {
  Authenticator: authenticator.Authenticator,
  HOTP: hotp.HOTP,
  TOTP: totp.TOTP,
  authenticator,
  hotp,
  totp
};
