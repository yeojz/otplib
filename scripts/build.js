/*eslint-disable no-console*/
const alias = require('rollup-plugin-alias');
const babel = require('babel-core');
const cleanup = require('rollup-plugin-cleanup');
const fs = require('fs');
const nodeResolve = require('rollup-plugin-node-resolve');
const path = require('path');
const rollup = require('rollup');

const aliases = require('./aliases');
const packages = require('./packages');
const packageJson = require('../package.json');

const ROOT_DIR = path.resolve(__dirname, '..');
const PACKAGE_DIR = path.join(ROOT_DIR, 'packages');

Object.keys(packages).forEach(pkgName => {
  console.log('building...', pkgName);

  const pkgConfig = packages[pkgName];
  const plugins = pkgConfig.plugins || [];

  const config = {
    banner: `/**\n * ${pkgName}\n * @version: ${packageJson.version}\n **/`,
    dest: path.join(ROOT_DIR, 'dist', `${pkgName}.js`),
    entry: path.join(PACKAGE_DIR, pkgName, 'index.js'),
    external: Object.keys(pkgConfig.globals || {}),
    format: pkgConfig.format || 'cjs',
    globals: pkgConfig.globals,
    moduleName: pkgName.replace('-', '.'),
    plugins: [
      ...plugins,
      alias(Object.assign({}, pkgConfig.aliases, aliases)),
      nodeResolve(Object.assign({}, pkgConfig.nodeResolve)),
      cleanup()
    ]
  }

  rollup.rollup(config)
    .then(bundle => bundle.write(config))
    .then(() => babel.transformFileSync(config.dest, {}))
    .then((result) => fs.writeFileSync(config.dest, result.code))
    .catch(e => console.error(e));
});

