const browsers = {
  targets: {
    browsers: ['last 5 versions']
  }
};

module.exports = {
  otplib: {
    bundler: 'rollup',
    alias: 'index',
    globals: {
      crypto: 'crypto',
      'thirty-two': 'thirty-two'
    }
  },
  'otplib-authenticator': {
    bundler: 'rollup',
    alias: 'authenticator',
    globals: {
      crypto: 'crypto',
      'thirty-two': 'thirty-two'
    }
  },
  'otplib-core': {
    bundler: 'rollup',
    alias: 'core'
  },
  'otplib-hotp': {
    bundler: 'rollup',
    alias: 'hotp'
  },
  'otplib-totp': {
    bundler: 'rollup',
    alias: 'totp'
  },
  'otplib-utils': {
    bundler: 'rollup',
    alias: 'utils'
  },
  'otplib-browser': {
    bundler: 'webpack',
    babel: {
      presets: [['env', browsers]]
    }
  }
};
