const path = require('path');
const packages = require('./packages');

const ROOT_DIR = path.resolve(__dirname, '..');
const PACKAGE_DIR = path.join(ROOT_DIR, 'packages');
const PACKAGE_NAME = Object.keys(packages);

const alias = PACKAGE_NAME.reduce((accum, name) => {
  accum[name] = path.join(PACKAGE_DIR, name, 'index.js');
  return accum;
}, {});

module.exports = alias;
