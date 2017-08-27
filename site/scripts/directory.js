const path = require('path');
const ROOT_DIR = path.resolve(__dirname, '..', '..');

module.exports = {
  ROOT: ROOT_DIR,
  WEBSITE_ROOT: path.join(ROOT_DIR, 'site'),
  WEBSITE_BUILD: path.join(ROOT_DIR, 'site', 'dist'),
}
