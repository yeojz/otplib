module.exports = {
  otplib: {
    alias: 'index',
    globals: {
      crypto: 'crypto',
      'thirty-two': 'thirty-two'
    }
  },
  'otplib-authenticator': {
    alias: 'authenticator',
    globals: {
      crypto: 'crypto',
      'thirty-two': 'thirty-two'
    }
  },
  'otplib-core': {
    alias: 'core'
  },
  'otplib-hotp': {
    alias: 'hotp'
  },
  'otplib-totp': {
    alias: 'totp'
  },
  'otplib-utils': {
    alias: 'utils'
  }
};
