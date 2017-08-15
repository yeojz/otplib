import hotp, {HOTP} from 'otplib-hotp';
import totp, {TOTP} from 'otplib-totp';
import authenticator, {Authenticator} from 'otplib-authenticator';
import crypto from './crypto';

/**
 * Instance of otplib (Entry File)
 *
 * One-Time Password Library
 *
 * @since 3.0.0
 * @author Gerald Yeo
 * @license MIT
 */
authenticator.options = {crypto}
hotp.options = {crypto}
totp.options = {crypto}

export default {
  Authenticator,
  HOTP,
  TOTP,
  authenticator,
  hotp,
  totp,
};
