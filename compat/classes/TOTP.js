if (process.env.OTPLIB_WEBPACK === 'true') {
  module.exports = require('../../src/classes/TOTP').default;
} else {
  module.exports = require('../../classes/TOTP').default;
}
