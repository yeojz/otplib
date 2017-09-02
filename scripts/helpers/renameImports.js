const packageConfig = require('../package.config');

// Renames all imports from otplib-[name] to ./[name]
function renameImports() {
  return Object.keys(packageConfig).reduce((accum, name) => {
    accum[name] = './' + name.replace('otplib-', '');
    return accum;
  }, {});
}

module.exports = renameImports();
