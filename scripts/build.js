/*eslint-disable no-console*/
const babel = require('babel-core');
const fs = require('fs');
const rollup = require('rollup');

const packageJson = require('../package.json');
const packages = require('./packages');
const PACKAGE_NAMES = Object.keys(packages);

const createModuleConfiguration = require('./createModuleConfiguration');

// Generate all pacakges
PACKAGE_NAMES.forEach(name => {
  console.log('building...', name);

  // Setup package details
  const pkg = packages[name];

  // Derive filename from the package folder
  const filename = name.replace('otplib-', '') + '.js';

  // Generate configuration
  const config = createModuleConfiguration(name, pkg, filename, packageJson.version);

  rollup.rollup(config)
    .then(bundle => bundle.write(config))
    .then(() => babel.transformFileSync(config.dest, {}))
    .then((result) => fs.writeFileSync(config.dest, result.code))
    .catch(e => console.error(e));
});

