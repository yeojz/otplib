/**
 * @otplib/preset-v11
 *
 * v11 compatibility preset.
 */

import { Authenticator } from "./authenticator";
import { HOTP } from "./hotp";
import { TOTP } from "./totp";

export { HOTP, TOTP, Authenticator };
export * from "./types";

export const hotp = new HOTP();
export const totp = new TOTP();
export const authenticator = new Authenticator();
