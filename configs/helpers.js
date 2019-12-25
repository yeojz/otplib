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

function packageFiles(pkg) {
  return pkg.files || [pkg.main];
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

exports.RWD = path.join(__dirname, '..');
exports.EXTENSIONS = ['.js', '.ts'];

exports.outputDirectory = cwd => path.join(cwd, 'build');
exports.fileNameNoExt = fileNameNoExt;
exports.packageJSON = packageJSON;
exports.packageFiles = packageFiles;
exports.banner = banner;
