/**
 * Generates a counter for TOTP
 *
 * @module core/totpCounter
 * @param {string} epoch - starting time since the UNIX epoch. Used to calculate the counter
 * @param {number} step - time step in seconds
 * @return {float}
 */
function totpCounter(epoch, step) {
  return Math.floor(epoch / step / 1000);
}

export default totpCounter;
