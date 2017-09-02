/* eslint-disable no-console */
const copy = require('copy');
const path = require('path');
const directory = require('./directory');

function copyFile(fileSrc, fileDest, fileBase) {
  const callback = (err) => {
    if (err) {
      console.error(err);
      return;
    }
    console.log('[build:site] copied', fileSrc);
  }

  copy.one(
    path.join(directory.WEBSITE_ROOT, fileSrc),
    path.join(directory.WEBSITE_ROOT, fileDest),
    { srcBase: path.join(directory.WEBSITE_ROOT, fileBase) },
    callback
  );
}

module.exports = copyFile;
