if (process.env.OTPLIB_WEBPACK === 'true') {
  module.exports = require('../../src/classes/OTPUtils').default;
} else {
  module.exports = require('../../classes/OTPUtils').default;
}
