if (process.env.OTPLIB_WEBPACK === 'true') {
  module.exports = require('../../src/classes/Authenticator').default;
} else {
  module.exports = require('../../classes/Authenticator').default;
}
