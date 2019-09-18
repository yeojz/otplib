const cryptojs = require('./builds/packages/otplib-plugin-crypto');
const base32 = require('./builds/packages/otplib-plugin-thirty-two');
const core = require('./builds/packages/otplib-core');

module.exports = {
  context: {
    'otplib': {
      hotp: new core.HOTP({
        createDigest: cryptojs.createDigest
      }),
      totp: new core.TOTP({
        createDigest: cryptojs.createDigest
      }),
      authenticator :new core.Authenticator({
        createDigest: cryptojs.createDigest,
        createRandomBytes: cryptojs.createRandomBytes,
        keyDecoder: base32.keyDecoder,
        keyEncoder: base32.keyEncoder,
      })
    }
  }
};
