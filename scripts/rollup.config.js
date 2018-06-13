/*eslint-disable no-console*/
const cleanup = require('rollup-plugin-cleanup');
const nodeResolve = require('rollup-plugin-node-resolve');
const path = require('path');

const buildConfig = require('../build.config');
const createBanner = require('./helpers/createBanner');
const directory = require('./helpers/directory');
const renameImports = require('./helpers/renameImports');

const PACKAGE_LIST = Object.keys(buildConfig).filter(
  name => buildConfig[name].bundler === 'rollup'
);

function rollupConfig(name, config, format) {
  const renameMap = renameImports(format);
  const filename = renameMap[name];

  console.log(['build:' + format, name, '=>', filename].join(' '));

  return {
    input: path.join(directory.SOURCE, name, 'index.js'),
    output: {
      banner: createBanner(name),
      file: path.join(directory.BUILD, filename + '.js'),
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

const list = PACKAGE_LIST.map(name => {
  const config = buildConfig[name];
  return rollupConfig(name, config, 'cjs');
});

module.exports = list;
