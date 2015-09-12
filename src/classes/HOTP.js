
import crypto from 'crypto';
import OTPUtils from './OTPUtils';


/**
 *
 * HMAC-based One-time Password Algorithm
 *
 * References
 * --------------------------
 * - http://en.wikipedia.org/wiki/HMAC-based_One-time_Password_Algorithm
 * - http://tools.ietf.org/html/rfc4226
 *
 * Algorithm
 * --------------------------
 * ```
 *  K be a secret secret
 *  C be a counter
 *  HMAC(K,C) = SHA1(K & 0x5c5c... | SHA1(K & 0x3636... | C))
 *  be an HMAC calculated with the SHA-1 cryptographic hash algorithm
 *  Truncate be a function that selects 4 bytes from the result of the
 *  HMAC in a defined manner
 *  HOTP(K,C) = Truncate(HMAC(K,C)) & 0x7FFFFFFF
 *  HOTP-Value = HOTP(K,C) mod 10d, where d is the desired number of digits
 * ```
 *
 * @class HOTP
 * @since 3.0.0
 * @author Gerald Yeo
 * @license MIT
 *
 */
export default class HOTP {

    /**
     * Creates the instance
     */
    constructor() {

        /**
         * @type {class}
         */
        this.utils = OTPUtils;

        /**
         * @type {number}
         */
        this.digits = 6;
    }


    /**
     * Option Setter
     *
     * @method options
     *
     * @param {Object} opt - custom options
     */
    options(opt = {}) {
        this.digits = opt.digits || this.digits;
    }


    /**
     * Generates the OTP code
     *
     * @method generate
     *
     * @param {string} secret - your secret that is used to generate the token
     * @param {number} counter - the OTP counter (usually it's an incremental count)
     * @return {number} OTP Code
     */
    generate(secret, counter) {

        // Convert secret to hex
        secret = OTPUtils.stringToHex(secret);

        // Ensure counter is a buffer or string (for HMAC creation)
        counter = OTPUtils.intToHex(counter);
        counter = OTPUtils.pad(counter, 16);

        // HMAC creation
        let cryptoHmac = crypto.createHmac('sha1', new Buffer(secret, 'hex'));

        // Update HMAC with the counter
        let hmac = cryptoHmac.update(new Buffer(counter, 'hex')).digest('hex');

        // offset := last nibble of hash
        let offset = OTPUtils.hexToInt(hmac.substr(hmac.length - 1));

        // truncatedHash := hash[offset..offset+3]
        // (4 bytes starting at the offset)
        let truncatedHash = hmac.substr(offset * 2, 8);

        // Set the first bit of truncatedHash to zero
        // (i.e. remove the most significant bit)
        let sigbit0 = OTPUtils.hexToInt(truncatedHash) & OTPUtils.hexToInt('7fffffff');

        // code := truncatedHash mod 1000000
        let code = sigbit0 % Math.pow(10, this.digits);

        // Pad code with 0 until length of code is 6
        code = OTPUtils.pad(code, this.digits);

        return code;
    }


    /**
     * Checks the provided OTP token against system generated token
     *
     * @method check
     *
     * @param {string} token - the OTP token to check
     * @param {string} secret - your secret that is used to generate the token
     * @param {number} counter - the OTP counter (usually it's an incremental count)
     * @return {boolean}
     */
    check(token, secret, counter = 0) {
        let systemToken = this.generate(secret, counter);
        return OTPUtils.isSameToken(token, systemToken);
    }
}



