const path = require('path');
const ROOT_DIR = path.resolve(__dirname, '..', '..');

module.exports = {
  BUILD: path.join(ROOT_DIR, process.env.BUILD_DIR || 'dist'),
  ROOT: ROOT_DIR,
  SOURCE: path.join(ROOT_DIR, 'packages')
}
