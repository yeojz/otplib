const cryptojs = require('./packages/otplib-plugin-crypto/build');
const base32 = require('./packages/otplib-plugin-thirty-two/build');
const core = require('./packages/otplib-core/build');

module.exports = {
  context: {
    otplib: {
      hotp: new core.HOTP({
        createDigest: cryptojs.createDigest
      }),
      totp: new core.TOTP({
        createDigest: cryptojs.createDigest
      }),
      authenticator: new core.Authenticator({
        createDigest: cryptojs.createDigest,
        createRandomBytes: cryptojs.createRandomBytes,
        keyDecoder: base32.keyDecoder,
        keyEncoder: base32.keyEncoder
      })
    }
  }
};
