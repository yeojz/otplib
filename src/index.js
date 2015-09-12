
import HOTP from './classes/HOTP';
import TOTP from './classes/TOTP';
import Authenticator from './classes/Authenticator';


/**
 *
 * Instance of otplib (Entry File)
 *
 * One-Time Password Library
 *
 * @since 3.0.0
 * @author Gerald Yeo
 * @license MIT
 */
export default {
    authenticator: new Authenticator(),
    hotp: new HOTP(),
    totp: new TOTP()
};
