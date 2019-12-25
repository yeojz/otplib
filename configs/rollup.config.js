/* eslint-disable @typescript-eslint/no-var-requires, @typescript-eslint/explicit-function-return-type */
const path = require('path');
const babel = require('rollup-plugin-babel');
const cleanup = require('rollup-plugin-cleanup');
const commonjs = require('@rollup/plugin-commonjs');
const resolve = require('@rollup/plugin-node-resolve');
const helpers = require('./helpers');

const CWD = process.cwd();
const pkg = helpers.packageJSON(CWD);

function rollupConfig(file) {
  const outputFile = path.join(
    helpers.outputDirectory(CWD),
    helpers.fileNameNoExt(file) + '.js'
  );

  return {
    input: path.join(CWD, file),
    output: {
      banner: helpers.banner(pkg),
      file: outputFile,
      format: 'cjs'
    },
    external: [
      'crypto',
      ...Object.keys(pkg.dependencies || {}),
      ...Object.keys(pkg.devDependencies || {}),
      ...Object.keys(pkg.peerDependencies || {})
    ],
    plugins: [
      babel({
        extensions: helpers.EXTENSIONS,
        babelrc: false,
        configFile: false,
        presets: [
          ['@babel/preset-env', { modules: false, targets: 'node 8' }],
          '@babel/preset-typescript'
        ]
      }),
      resolve({
        extensions: helpers.EXTENSIONS,
        preferBuiltins: true,
        rootDir: helpers.RWD
      }),
      commonjs({
        include: 'node_modules/**'
      }),
      cleanup({
        comments: 'none',
        extensions: helpers.EXTENSIONS.map(v => v.slice(1))
      })
    ]
  };
}

module.exports = helpers.packageFiles(pkg).map(rollupConfig);
