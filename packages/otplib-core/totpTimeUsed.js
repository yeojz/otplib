/**
 * Calculates the number of seconds used in the current tick for TOTP
 *
 * @module otplib-core/totpTimeUsed
 * @param {number} epoch - starting time since the UNIX epoch (seconds)
 * @param {number} step - time step (seconds)
 * @return {number} - in seconds
 */
export function totpTimeUsed(epoch, step) {
  return epoch % step;
}

export default totpTimeUsed;
