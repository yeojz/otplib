const pkg = require('../../package.json');

function createBanner(name) {
  return `/**
 * ${name}
 *
 * @author ${pkg.author}
 * @version: ${pkg.version}
 * @license: ${pkg.license}
 **/`
}

module.exports = createBanner;
