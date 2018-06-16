import totpTimeUsed from './totpTimeUsed';

/**
 * Calculates the number of seconds till next tick for TOTP
 *
 * @module otplib-core/totpTimeRemaining
 * @param {number} epoch - starting time since the UNIX epoch (seconds)
 * @param {number} step - time step (seconds)
 * @return {number} - in seconds
 */
function timeRemaining(epoch, step) {
  return step - totpTimeUsed(epoch, step);
}

export default timeRemaining;
