const buildConfig = require('../../build.config');

const suffixes = {
  cjs: '',
  es: '.es'
};

// Renames all imports from otplib-[name] to ./[name]
function renameImports(format) {
  const suffix = suffixes[format];

  return Object.keys(buildConfig).reduce((accum, name) => {
    accum[name] = './' + buildConfig[name].alias + suffix;
    return accum;
  }, {});
}

module.exports = renameImports;
