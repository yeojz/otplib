const pkg = require('../package.json');

function createBanner(name) {
  return `/**
 * ${name}
 *
 * @author Gerald Yeo
 * @version: ${pkg.version}
 * @license: MIT
 **/`
}

module.exports = createBanner;
