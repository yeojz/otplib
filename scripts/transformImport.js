
const packages = require('./packages');

const transformImport = Object.keys(packages).reduce((accum, name) => {
  accum[name] = './' + name.replace('otplib-', '');
  return accum;
}, {});

module.exports = transformImport;
