if (process.env.OTPLIB_WEBPACK === 'true') {
  module.exports = require('../../src/classes/HOTP').default;
} else {
  module.exports = require('../../classes/HOTP').default;
}
