const packageConfig = require('../package.config');

const suffixes = {
  cjs: '',
  es: '.es'
};

// Renames all imports from otplib-[name] to ./[name]
function renameImports(format) {
  const suffix = suffixes[format];

  return Object.keys(packageConfig).reduce((accum, name) => {
    accum[name] = './' + packageConfig[name].alias + suffix;
    return accum;
  }, {});
}

module.exports = renameImports;
