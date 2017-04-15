/* eslint-disable no-console */

let ncp = require('ncp').ncp;
let pkg = require('../../package.json');
let path = require('path');

const PKG_DIR = path.resolve(__dirname, '..', '..');
const SOURCE_DIR = path.resolve(PKG_DIR, 'docs', pkg.name, pkg.version);
const DEST_DIR = path.resolve(PKG_DIR, 'site', 'dist', 'docs')

function copyDocs() {
  ncp(SOURCE_DIR, DEST_DIR, function (err) {
    if (err) {
      console.error(err);
      return;
    }
    console.log('[docs] moved to public');
  });
}

module.exports = copyDocs;
