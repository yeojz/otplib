/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');
const directory = require('./directory');

function createIndexFile(PUBLIC_URL, pkg) {
  const publicUrl = (PUBLIC_URL === '/') ? '' : PUBLIC_URL;
  const indexFile = path.join(directory.WEBSITE_ROOT, 'public', 'index.html');
  const outputFile = path.join(directory.WEBSITE_BUILD, 'index.html');

  fs.readFile(indexFile, (err, content) => {
    if (err) {
      console.error(err);
      return;
    }

    const parsed = content.toString()
      .replace(/\%PUBLIC_URL\%/g, publicUrl)
      .replace(/\%KEYWORDS\%/g, pkg.keywords.join(', '))
      .replace(/\%PACKAGE_VERSION\%/g, pkg.version);

    fs.writeFile(outputFile, parsed, (err) => {
      if (err) {
        console.error(err);
        return;
      }
      console.log('[build:site] index created');
    });
  });
}

module.exports = createIndexFile;
