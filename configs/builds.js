/* eslint-disable @typescript-eslint/explicit-function-return-type,@typescript-eslint/no-var-requires */
const contents = require('./contents');

const buildModule = (custom = {}) => ({
  bundler: 'rollup',
  files: ['src/index.ts'],
  format: 'cjs',
  presetEnv: {
    targets: 'node 8'
  },
  pkg: {},
  readme: '',
  ...custom
});

const buildBundle = (custom = {}) => ({
  bundler: 'webpack',
  files: ['src/index.ts'],
  format: 'umd',
  presetEnv: {
    targets: 'cover 99.5%'
  },
  pkg: {},
  readme: '',
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
    ],
    pkg: contents.pkg({
      keywords: [
        'one time password',
        'google authenticator',
        'authentication',
        '2FA',
        '2 factor',
        'node',
        'browser'
      ]
    }),
    readme: contents.file('README.md')
  }),
  'otplib-core': buildModule({
    pkg: contents.pkg({
      keywords: ['otplib-core']
    })
  }),
  'otplib-core-async': buildModule({
    pkg: contents.pkg({
      keywords: ['otplib-core']
    })
  }),
  'otplib-plugin-base32-enc-dec': buildModule({
    pkg: contents.pkg({
      keywords: ['otplib-plugin', 'otplib-base32']
    })
  }),
  'otplib-plugin-thirty-two': buildModule({
    pkg: contents.pkg({
      keywords: ['otplib-plugin', 'otplib-base32']
    })
  }),
  'otplib-plugin-crypto': buildModule({
    pkg: contents.pkg({
      keywords: ['otplib-plugin', 'otplib-crypto']
    })
  }),
  'otplib-plugin-crypto-js': buildModule({
    pkg: contents.pkg({
      keywords: ['otplib-plugin', 'otplib-crypto']
    })
  }),
  'otplib-plugin-crypto-async-ronomon': buildModule({
    pkg: contents.pkg({
      keywords: ['otplib-plugin', 'otplib-crypto']
    })
  }),
  'otplib-preset-browser': buildBundle({
    pkg: contents.pkg({
      keywords: ['otplib-preset', 'browser']
    })
  }),
  'otplib-preset-default': buildModule({
    pkg: contents.pkg({
      keywords: ['otplib-preset', 'node']
    })
  }),
  'otplib-preset-default-async': buildModule({
    pkg: contents.pkg({
      keywords: ['otplib-preset', 'node']
    })
  }),
  'otplib-preset-v11': buildModule({
    files: ['src/index.js'],
    pkg: contents.pkg({
      keywords: ['otplib-preset', 'otplib-compat']
    })
  })
};
