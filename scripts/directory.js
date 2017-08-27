const path = require('path');
const ROOT_DIR = path.resolve(__dirname, '..');

module.exports = {
  ROOT: ROOT_DIR,
  SOURCE: path.join(ROOT_DIR, 'packages'),
  TARGET: process.env.BUILD_DIR || path.join(ROOT_DIR, 'dist'),
}
