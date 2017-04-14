if (process.env.OTPLIB_WEBPACK === 'true') {
  module.exports = require('../src/v2').default;
} else {
  module.exports = require('../v2').default;
}
