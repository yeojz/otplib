const cleanup = require('rollup-plugin-cleanup');
const nodeResolve = require('rollup-plugin-node-resolve');
const path = require('path');

const packages = require('./packages');

const PACKAGE_NAMES = Object.keys(packages);
const ROOT_DIR = path.resolve(__dirname, '..');
const SOURCE_DIR = path.join(ROOT_DIR, 'packages');

// Transforms package like import to the compiled entry file
// i.e. otplib-core to ./core
const transformImport = Object.keys(packages)
  .reduce((accum, name) => {
    accum[name] = './' + name.replace('otplib-', '');
    return accum;
  }, {});

function createModuleConfiguration(name, pkg, filename, version) {
  return {
    banner: `
      /**
       * ${name}
       *
       * @author Gerald Yeo
       * @version: ${version}
       * @license: MIT
       **/
    `,
    dest: path.join(ROOT_DIR, 'dist', filename),
    entry: path.join(SOURCE_DIR, name, 'index.js'),
    format: pkg.format || 'cjs',
    globals: pkg.globals,

    // Derive and set the module names from package folders
    moduleName: name.replace('-', '.'),

    // Set all packages as an external reference
    external: Object.keys(pkg.globals || {}).concat(PACKAGE_NAMES),

    paths: transformImport,

    plugins: [
      nodeResolve(),
      cleanup({
        comments: 'none'
      })
    ]
  }
}

module.exports = createModuleConfiguration;
