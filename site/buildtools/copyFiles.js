/* eslint-disable no-console */

const copy = require('copy');
const path = require('path');
const ROOT_DIR = path.join(__dirname, '..');

function copyFiles(files) {
  files.forEach((file) => {
    copy.one(
      path.join(ROOT_DIR, file[0]),
      path.join(ROOT_DIR, file[1]),
      {
        srcBase: path.join(ROOT_DIR, file[2])
      },
      function (err) {
        if (err) {
          console.error(err);
          return;
        }
        console.log('[files] copied');
      }
    );
  });
}

module.exports = copyFiles;
