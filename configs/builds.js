const defaultPresetEnv = {
  targets: 'node 8'
};

const standard = alias => ({
  alias,
  external: [],
  bundler: 'rollup',
  files: ['index.ts'],
  format: 'cjs',
  presetEnv: defaultPresetEnv
});

module.exports = {
  // core
  'otplib-hotp': standard('hotp'),
  'otplib-totp': standard('totp'),
  'otplib-authenticator': standard('authenticator'),
  'otplib-core': standard('core'),

  'otplib-hotp-async': standard('hotp-async'),
  'otplib-totp-async': standard('totp-async'),
  'otplib-authenticator-async': standard('authenticator-async'),
  'otplib-core-async': standard('core-async'),

  // base32
  'otplib-plugin-base32-enc-dec': {
    ...standard('plugin-base32-enc-dec'),
    external: ['base32-encode', 'base32-decode']
  },
  'otplib-plugin-thirty-two': {
    ...standard('plugin-thirty-two'),
    external: ['thirty-two']
  },

  // crypto
  'otplib-plugin-crypto': {
    ...standard('plugin-crypto'),
    external: ['crypto']
  },
  'otplib-plugin-crypto-js': {
    ...standard('plugin-crypto-js'),
    external: ['crypto']
  },
  'otplib-plugin-crypto-async-ronomon': {
    ...standard('plugin-crypto-async-ronomon'),
    external: ['@ronomon/crypto-async', 'crypto']
  },

  // presets
  'otplib-preset-browser': {
    alias: 'preset-browser',
    bundler: 'webpack',
    files: ['index.ts'],
    format: 'umd',
    presetEnv: {
      targets: 'cover 99.5%'
    }
  },

  'otplib-preset-default': standard('preset-default'),
  'otplib-preset-default-async': standard('preset-default-async'),

  'otplib-preset-v11': {
    ...standard('preset-v11'),
    files: ['index.js']
  }
};
