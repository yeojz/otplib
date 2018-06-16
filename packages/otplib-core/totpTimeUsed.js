/**
 * Calculates the number of seconds used in the current tick for TOTP
 *
 * @module otplib-core/totpTimeUsed
 * @param {number} epoch - starting time since the JavasSript epoch (seconds) (UNIX epoch * 1000)
 * @param {number} step - time step (seconds)
 * @return {number} - in seconds
 */
function totpTimeUsed(epoch, step) {
  return Math.floor(epoch / 1000) % step;
}

export default totpTimeUsed;
