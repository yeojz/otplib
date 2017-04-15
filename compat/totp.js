if (process.env.OTPLIB_WEBPACK === 'true') {
  module.exports = require('../src/totp').default;
} else {
  module.exports = require('../totp').default;
}
