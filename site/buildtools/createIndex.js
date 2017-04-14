/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');
const pkg = require('../../package.json');

const ROOT_DIR = path.join(__dirname, '..');

function createIndex(PUBLIC_URL) {
  const indexFile = path.join(ROOT_DIR, 'public', 'index.html');

  fs.readFile(indexFile, (err, content) => {
    if (err) {
      console.error(err);
      return;
    }

    const parsed = content.toString()
      .replace(/\%PUBLIC_URL\%/g, PUBLIC_URL)
      .replace(/\%KEYWORDS\%/g, pkg.keywords.join(', '))
      .replace(/\%PACKAGE_VERSION\%/g, pkg.version);

    fs.writeFile(path.join(ROOT_DIR, 'dist', 'index.html'), parsed, (err) => {
      if (err) {
        console.error(err);
        return;
      }
      console.log('[index] created');
    });
  });
}

module.exports = createIndex;
