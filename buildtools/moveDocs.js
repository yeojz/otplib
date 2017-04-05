/* eslint-disable no-console */

let ncp = require('ncp').ncp;
let pkg = require('../package.json');
let path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const SOURCE_DIR = path.resolve(ROOT_DIR, 'docs', pkg.name, pkg.version);
const DEST_DIR = path.resolve(ROOT_DIR, 'site', 'public', 'docs')

ncp(SOURCE_DIR, DEST_DIR, function (err) {
 if (err) {
   console.error(err);
   return;
 }
 console.log('[docs] moved to public');
});
