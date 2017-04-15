if (process.env.OTPLIB_WEBPACK === 'true') {
  module.exports = require('../src/hotp').default;
} else {
  module.exports = require('../hotp').default;
}
