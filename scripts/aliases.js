const path = require('path');
const directory = require('./directory');
const packages = require('./packages');

function aliases() {
  return Object.keys(packages).reduce((accum, name) => {
    accum[name] = path.join(directory.SOURCE, name, 'index.js');
    return accum;
  }, {});
}

module.exports = aliases();
