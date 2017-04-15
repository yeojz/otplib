if (process.env.OTPLIB_WEBPACK === 'true') {
  module.exports = require('../src/authenticator').default;
} else {
  module.exports = require('../authenticator').default;
}
