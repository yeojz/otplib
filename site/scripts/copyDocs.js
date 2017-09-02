/* eslint-disable no-console */
const path = require('path');
const ncp = require('ncp').ncp;
const pkg = require('../../package.json');
const directory = require('./directory');

function copyDocs() {

  const callback = (err) => {
    if (err) {
      console.error(err);
      return;
    }
    console.log('[docs] moved to public');
  }

  ncp(
    path.join(directory.ROOT, 'docs', pkg.name, pkg.version),
    path.join(directory.WEBSITE_BUILD, 'docs'),
    callback
  );
}

module.exports = copyDocs;
