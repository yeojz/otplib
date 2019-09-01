/* eslint-disable @typescript-eslint/no-var-requires, @typescript-eslint/explicit-function-return-type */
const babel = require('rollup-plugin-babel');
const cleanup = require('rollup-plugin-cleanup');
const commonjs = require('rollup-plugin-commonjs');
const nodeResolve = require('rollup-plugin-node-resolve');
const createBundleType = require('./createBundleType');

/**
 * Builds module for node consumption
 *
 * @param {string} name name of package
 * @param {object} config build config
 * @param {string} file eg: index.ts
 */
function rollupConfig(config, helpers) {
  console.log(['build:', config.sourceFile, '=>', config.buildFile].join(' '));

  const pkgs = helpers.renameImports('buildImport');

  return {
    input: config.sourceFilePath,
    output: {
      banner: helpers.createBanner(config.sourceImport),
      file: config.buildFilePath,
      format: config.format,
      paths: pkgs
    },
    external: [...config.external, ...Object.keys(pkgs)],
    plugins: [
      babel({
        extensions: helpers.EXTENSIONS,
        babelrc: false,
        configFile: false,
        presets: [
          ['@babel/preset-env', { modules: false, ...config.presetEnv }],
          '@babel/preset-typescript'
        ]
      }),
      nodeResolve({
        extensions: helpers.EXTENSIONS,
        preferBuiltins: true
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

module.exports = createBundleType('rollup', rollupConfig);
