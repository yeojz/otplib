if (process.env.OTPLIB_WEBPACK === 'true') {
  module.exports = require('../src/index').default;
} else {
  module.exports = require('../index').default;
}
