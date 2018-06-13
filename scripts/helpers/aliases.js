const path = require('path');
const directory = require('./directory');
const buildConfig = require('../../build.config');

function aliases() {
  return Object.keys(buildConfig).reduce((accum, name) => {
    accum[name] = path.join(directory.SOURCE, name, 'index.js');
    return accum;
  }, {});
}

module.exports = aliases();
