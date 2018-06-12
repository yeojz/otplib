/**
 * Generates a counter for TOTP
 *
 * @module otplib-core/totpCounter
 * @param {number} epoch - starting time since the UNIX epoch (seconds)
 * @param {number} step - time step (seconds)
 * @return {float}
 */
function totpCounter(epoch, step) {
  return Math.floor(epoch / step / 1000);
}

export default totpCounter;
