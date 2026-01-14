/**
 * @otplib/preset-v11
 *
 * v11 compatibility preset.
 */

import { Authenticator } from "./authenticator.js";
import { HOTP } from "./hotp.js";
import { TOTP } from "./totp.js";

export { HOTP, TOTP, Authenticator };
export * from "./types.js";

export const hotp = new HOTP();
export const totp = new TOTP();
export const authenticator = new Authenticator();
