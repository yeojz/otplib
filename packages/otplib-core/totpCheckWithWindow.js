import totpCheck from './totpCheck';

function getPrevWindowOption(options, windowCount) {
  return Object.assign(options, {
    epoch: options.epoch - (options.step * windowCount)
  });
}

/**
 * Checks the provided OTP token against system generated token
 * with support for checking previous x time-step windows
 *
 * @module otplib-core/totpCheck
 * @param {string} token - the OTP token to check
 * @param {string} secret - your secret that is used to generate the token
 * @param {object} options - options which was used to generate it originally
 * @return {boolean}
 */
function totpCheckWithWindow(token, secret, options) {
  let opt = Object.assign({}, options);
  const rounds = Math.floor(opt.window || 0) + 1;

  for (let i = 0; i < rounds; i++) {
    opt = getPrevWindowOption(opt, i);

    if (totpCheck(token, secret, opt)) {
      return true;
    }
  }

  return false;
}

export default totpCheckWithWindow;
