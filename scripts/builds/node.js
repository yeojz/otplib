/*eslint-disable no-console*/
const createModule = require('../createModule');
const pack = require('../pack');
const packages = require('../packages');

const PACKAGE_NAMES = Object.keys(packages);

// CommonJS Packages
PACKAGE_NAMES.forEach(name => {
  const pkgConfig = packages[name];

  // Default derive filename from the package folder
  const filename = name.replace('otplib-', '') + '.js';

  console.log('building...', filename);
  pack(createModule(name, pkgConfig, filename));
});
