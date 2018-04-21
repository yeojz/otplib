import totpCheck from './totpCheck';

function createChecker(token, secret, opt) {
  const delta = opt.step * 1000;
  const epoch = opt.epoch;

  return (direction, start, bounds) => {
    for (let i = start; i <= bounds; i++) {
      opt.epoch = epoch + direction * i * delta;

      if (totpCheck(token, secret, opt)) {
        return i === 0 ? 0 : direction * i;
      }
    }
    return null;
  };
}

function getWindowBounds(opt) {
  const bounds = Array.isArray(opt.window)
    ? opt.window
    : [parseInt(opt.window, 10), parseInt(opt.window, 10)];

  if (!Number.isInteger(bounds[0]) || !Number.isInteger(bounds[1])) {
    throw new Error('Expecting options.window to be a number or an array');
  }

  return bounds;
}

/**
 * Checks the provided OTP token against system generated token
 * with support for checking previous x time-step windows
 *
 * @module otplib-core/totpCheckWithWindow
 * @param {string} token - the OTP token to check
 * @param {string} secret - your secret that is used to generate the token
 * @param {object} options - options which was used to generate it originally
 * @return {integer} - the number of windows back (-) or forward it was successful. null otherwise
 */
function totpCheckWithWindow(token, secret, options) {
  let opt = Object.assign({}, options);

  const bounds = getWindowBounds(opt);
  const checker = createChecker(token, secret, opt);
  const backward = checker(-1, 0, bounds[0]);
  return backward !== null ? backward : checker(1, 1, bounds[1]);
}

export default totpCheckWithWindow;
