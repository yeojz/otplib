/*eslint-disable no-console*/
const babel = require('babel-core');
const fs = require('fs');
const rollup = require('rollup');
function pack(config) {
  rollup.rollup(config)
    .then(bundle => bundle.write(config))
    .then(() => babel.transformFileSync(config.dest, {}))
    .then((result) => fs.writeFileSync(config.dest, result.code))
    .catch(e => console.error(e));
}

module.exports = pack;
