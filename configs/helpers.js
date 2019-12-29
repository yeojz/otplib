/* eslint-disable @typescript-eslint/no-var-requires, @typescript-eslint/explicit-function-return-type */
const fs = require('fs');
const path = require('path');

function fileNameNoExt(file) {
  return path.basename(file, path.extname(file));
}

function packageJSON(cwd) {
  try {
    const contents = fs.readFileSync(path.join(cwd, 'package.json'));
    return JSON.parse(contents);
  } catch (err) {
    return {};
  }
}

function buildConfig(pkg) {
  return pkg.otplib || {};
}

function packageFiles(pkg) {
  return buildConfig(pkg).files || [pkg.main];
}

function banner(pkg) {
  return `/**
 * ${pkg.name}
 *
 * @author ${pkg.author}
 * @version: ${pkg.version}
 * @license: ${pkg.license}
 **/`;
}

exports.ROOT_DIR = path.join(__dirname, '..');
exports.EXTENSIONS = ['.js', '.ts'];

exports.banner = banner;
exports.buildConfig = buildConfig;
exports.fileNameNoExt = fileNameNoExt;
exports.outputDirectory = cwd => path.join(cwd, 'builds');
exports.packageFiles = packageFiles;
exports.packageJSON = packageJSON;
