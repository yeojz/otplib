/* eslint-disable @typescript-eslint/no-var-requires, @typescript-eslint/explicit-function-return-type */
const babel = require('rollup-plugin-babel');
const cleanup = require('rollup-plugin-cleanup');
const commonjs = require('rollup-plugin-commonjs');
const nodeResolve = require('rollup-plugin-node-resolve');
const createBundleType = require('./helpers').createBundleType;

/**
 * Builds module for node consumption
 *
 * @param {string} name name of package
 * @param {object} config build config
 * @param {string} file eg: index.ts
 */
function rollupConfig(config) {
  console.log(['build:', config.sourceFile, '=>', config.buildFile].join(' '));

  return {
    input: config.sourceFilePath,
    output: {
      banner: config.banner,
      file: config.buildFilePath,
      format: config.format
    },
    external: config.external,
    plugins: [
      babel({
        extensions: config.extensions,
        babelrc: false,
        configFile: false,
        presets: [
          ['@babel/preset-env', { modules: false, ...config.presetEnv }],
          '@babel/preset-typescript'
        ]
      }),
      nodeResolve({
        extensions: config.extensions,
        preferBuiltins: true
      }),
      commonjs({
        include: 'node_modules/**'
      }),
      cleanup({
        comments: 'none',
        extensions: config.extensions.map(v => v.slice(1))
      })
    ]
  };
}

module.exports = createBundleType('rollup', rollupConfig);
