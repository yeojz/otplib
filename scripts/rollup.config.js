/*eslint-disable no-console*/
const cleanup = require('rollup-plugin-cleanup');
const nodeResolve = require('rollup-plugin-node-resolve');
const path = require('path');

const packageConfig = require('./package.config');
const createBanner = require('./helpers/createBanner');
const directory = require('./helpers/directory');
const renameImports = require('./helpers/renameImports');

const PACKAGE_LIST = Object.keys(packageConfig);
const PACKAGE_NAME = process.env.OTPLIB_NAME;

if (!PACKAGE_NAME) {
  throw new Error('process.env.OTPLIB_NAME is not defined.');
}

const config = packageConfig[PACKAGE_NAME];

if (!config) {
  throw new Error('Unable to find configuration for ', PACKAGE_NAME);
}

function buildConfig(format) {
  const renameMap = renameImports(format);
  const FILENAME = renameMap[PACKAGE_NAME];

  console.log('format -', format);
  console.log('build -', PACKAGE_NAME);
  console.log('output -', FILENAME);

  return {
    input: path.join(directory.SOURCE, PACKAGE_NAME, 'index.js'),
    output: {
      banner: createBanner(PACKAGE_NAME),
      file: path.join(directory.BUILD, FILENAME + '.js'),
      format: format,
      globals: config.globals,
      paths: renameMap
    },
    external: Object.keys(config.globals || {}).concat(PACKAGE_LIST),
    plugins: [
      nodeResolve(),
      cleanup({
        comments: 'none'
      })
    ]
  };
}

module.exports = [buildConfig('cjs')];
