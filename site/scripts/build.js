/* eslint-disable no-console */
const pkg = require('../package.json');
const copyDocs = require('./copyDocs');
const copyFile = require('./copyFile');
const createIndexFile = require('./createIndexFile');

const PUBLIC_URL = process.env.PUBLIC_URL || pkg.homepage;
const targets = (process.env.BUILD_PKG || '').split(',');

if (targets.indexOf('site') > -1) {
  createIndexFile(PUBLIC_URL, pkg);

  // Library Files
  copyFile('../dist/otplib-browser.js', 'dist/lib', '../dist');

  // Assets
  copyFile('public/otplib.png', 'dist', 'public');
  copyFile('public/favicon.ico', 'dist', 'public');
  copyFile('public/style.css', 'dist/css', 'public');
  copyFile('public/app.js', 'dist/js', 'public');
  copyFile('node_modules/qrcode/build/qrcode.min.js', 'dist/js', 'node_modules/qrcode/build');

  // CI/CD
  copyFile('circle.yml', 'dist', '');
}

if (targets.indexOf('docs') > -1) {
  copyDocs();
}
