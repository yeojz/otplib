/**
 *
 * TOTP - Time-based One-time Password Algorithm
 *
 * References
 * --------------------------
 * - http://en.wikipedia.org/wiki/Time-based_One-time_Password_Algorithm
 * - http://tools.ietf.org/html/rfc6238
 *
 * Algorithm
 * --------------------------
 * Let:
 *  - T0 be an epoch
 *  - TS be the time stemp
 *  - TC be the current timestamp turned into an int, using defined T0, counting in TS units
 *  - TC = (unixtime(now) - unixtime(T0)) / TS
 *  - TOTP = HOTP(secretsecret, TC), where the HOTP algorithm is defined below.
 *  - TOTP-Value = TOTP mod 10d, where d is the desired number of digits of the one-time password.
 *
 */

import HOTP from './HOTP';


// Class Definition
// --------------------------------------------------------
class TOTP extends HOTP {

  constructor() {
    super();
    this.step = 30;
    this.epoch = null;
  }

  options(opt = {}) {
    super.options(opt);
    this.step = opt.step || this.step;
  }


  generate(secret) {
    let epoch = this.epoch || new Date().getTime();
    let timeStep = this.step;
    let timeCounter = Math.floor(epoch / (timeStep * 1000.0));
    let code = super.generate(secret, timeCounter);

    return code;
  }


  check(token, secret){
    let systemToken = this.generate(secret);
    return this.utils.isSameToken(token, systemToken);
  }
}







// Export
// --------------------------------------------------------
export default TOTP;
