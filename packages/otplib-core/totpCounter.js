/**
 * Generates a counter for TOTP
 *
 * @module otplib-core/totpCounter
 * @param {number} epoch - starting time since the JavasSript epoch (seconds) (UNIX epoch * 1000)
 * @param {number} step - time step (seconds)
 * @return {float}
 */
function totpCounter(epoch, step) {
  return Math.floor(epoch / step / 1000);
}

export default totpCounter;
