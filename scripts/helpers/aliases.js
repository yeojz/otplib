const path = require('path');
const directory = require('./directory');
const PACKAGE_LIST = require('../package.config');

function aliases() {
  return Object.keys(PACKAGE_LIST).reduce((accum, name) => {
    accum[name] = path.join(directory.SOURCE, name, 'index.js');
    return accum;
  }, {});
}

module.exports = aliases();
