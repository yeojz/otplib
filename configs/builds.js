/* eslint-disable @typescript-eslint/explicit-function-return-type */
const pkgDefaults = {
  main: 'index.js',
  typings: 'index.d.ts'
};

const buildModule = (custom = {}) => ({
  bundler: 'rollup',
  files: ['src/index.ts'],
  format: 'cjs',
  presetEnv: {
    targets: 'node 8'
  },
  pkg: pkgDefaults,
  ...custom
});

const buildBundle = (custom = {}) => ({
  bundler: 'webpack',
  files: ['src/index.ts'],
  format: 'umd',
  presetEnv: {
    targets: 'cover 99.5%'
  },
  pkg: pkgDefaults,
  ...custom
});

module.exports = {
  otplib: buildModule({
    files: [
      'src/index.ts',
      'src/core.ts',
      'src/core-async.ts',
      'src/preset-default.ts',
      'src/preset-v11.ts'
    ]
  }),
  'otplib-core': buildModule(),
  'otplib-core-async': buildModule(),
  'otplib-plugin-base32-enc-dec': buildModule(),
  'otplib-plugin-thirty-two': buildModule(),
  'otplib-plugin-crypto': buildModule(),
  'otplib-plugin-crypto-js': buildModule(),
  'otplib-plugin-crypto-async-ronomon': buildModule(),
  'otplib-preset-browser': buildBundle(),
  'otplib-preset-default': buildModule(),
  'otplib-preset-default-async': buildModule(),
  'otplib-preset-v11': buildModule({
    files: ['src/index.js']
  })
};
