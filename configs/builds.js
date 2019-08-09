const defaultPresetEnv = {
  targets: 'node 8'
};

module.exports = {
  'otplib-authenticator': {
    alias: 'authenticator',
    bundler: 'rollup',
    external: [],
    files: ['index.ts'],
    format: 'cjs',
    presetEnv: defaultPresetEnv
  },
  'otplib-base32': {
    alias: 'base32',
    bundler: 'rollup',
    external: ['thirty-two', 'base32-encode', 'base32-decode'],
    files: ['base32-endec.ts', 'thirty-two.ts'],
    format: 'cjs',
    presetEnv: defaultPresetEnv
  },
  'otplib-browser': {
    alias: 'browser',
    bundler: 'webpack',
    files: ['index.ts'],
    format: 'umd',
    presetEnv: {
      targets: 'cover 99.5%'
    }
  },
  'otplib-core': {
    alias: 'core',
    bundler: 'rollup',
    external: [],
    files: ['index.ts'],
    format: 'cjs',
    presetEnv: defaultPresetEnv
  },
  'otplib-cryptojs': {
    alias: 'cryptojs',
    bundler: 'rollup',
    external: ['crypto-js'],
    files: ['index.ts'],
    format: 'cjs',
    presetEnv: defaultPresetEnv
  },
  'otplib-legacy': {
    alias: 'legacy',
    bundler: 'rollup',
    external: [],
    files: ['index.js'],
    format: 'cjs',
    presetEnv: defaultPresetEnv
  },
  'otplib-node': {
    alias: 'node',
    bundler: 'rollup',
    external: ['crypto'],
    files: ['index.ts'],
    format: 'cjs',
    presetEnv: defaultPresetEnv
  }
};
