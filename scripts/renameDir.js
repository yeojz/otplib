/* eslint-disable @typescript-eslint/no-var-requires */
const fs = require('fs');
const path = require('path');
const buildConfig = require('../configs/builds');

const BUILD_DIRECTORY = path.join(__dirname, '..', 'builds', 'otplib');

fs.readdirSync(BUILD_DIRECTORY).forEach(folder => {
  const config = buildConfig[folder];

  if (config && config.alias) {
    fs.renameSync(
      path.join(BUILD_DIRECTORY, folder),
      path.join(BUILD_DIRECTORY, config.alias)
    );
  }
});
