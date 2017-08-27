const cleanup = require('rollup-plugin-cleanup');
const nodeResolve = require('rollup-plugin-node-resolve');
const path = require('path');

const createBanner = require('./createBanner');
const directory = require('./directory');
const packages = require('./packages');

const PACKAGE_NAMES = Object.keys(packages);

// Transforms package like import to the compiled entry file
// i.e. otplib-core to ./core
const transformImport = Object.keys(packages)
  .reduce((accum, name) => {
    accum[name] = './' + name.replace('otplib-', '');
    return accum;
  }, {});

function createModule(name, pkgConfig, filename) {
  const plugins = pkgConfig.plugins || [];
  const defaultExternal = Object.keys(pkgConfig.globals || {}).concat(PACKAGE_NAMES);

  return {
    banner: createBanner(name),
    dest: path.join(directory.BUILD, filename),
    entry: path.join(directory.SOURCE, name, 'index.js'),
    format: pkgConfig.format || 'cjs',
    globals: pkgConfig.globals,

    // Derive and set the module names from package folders
    moduleName: name.replace('-', '.'),

    // Set all packages as an external reference
    external: pkgConfig.external || defaultExternal,

    paths: transformImport,

    plugins: [
      ...plugins,
      nodeResolve(pkgConfig.nodeResolve || {}),
      cleanup({
        comments: 'none'
      })
    ]
  }
}

module.exports = createModule;
