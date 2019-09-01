/* eslint-disable @typescript-eslint/no-var-requires, @typescript-eslint/explicit-function-return-type */
const path = require('path');
const pkg = require('../package.json');
const buildConfig = require('./builds');

const EXTENSIONS = ['.js', '.ts'];
const ROOT_DIRECTORY = path.join(__dirname, '..');
const BUILD_DIRECTORY = path.join(ROOT_DIRECTORY, 'builds', 'otplib');
const SOURCE_DIRECTORY = path.join(ROOT_DIRECTORY, 'packages');

function createPackages() {
  const outputs = {};

  Object.keys(buildConfig).forEach(name => {
    const config = buildConfig[name];

    const moduleInfo = file => {
      const basename = file
        .split('.')
        .slice(0, -1)
        .join('.');

      // Added a new variable
      // in the event we are adding postfix
      const buildBasename = basename;

      return {
        bundler: config.bundler,
        external: config.external || [],
        format: config.format,
        presetEnv: config.presetEnv || {},

        // index OR filename
        basename: basename === 'index' ? 'index' : basename,

        // otplib-core OR otpilb-core/file
        sourceImport: path.join(name, basename === 'index' ? '' : basename),

        // otplib-core/index.ts
        sourceFile: path.join(name, file),

        // index.ts
        sourceFileName: file,

        // full path to index.ts
        sourceFilePath: path.join(SOURCE_DIRECTORY, name, file),

        // core OR core/file
        buildImport: path.join(
          config.alias,
          buildBasename === 'index' ? '' : buildBasename
        ),

        // core/index.js
        buildFile: path.join(config.alias, buildBasename + '.js'),

        // index.js
        buildFileName: buildBasename + '.js',

        // full path to index.js
        buildFilePath: path.join(
          BUILD_DIRECTORY,
          config.alias,
          buildBasename + '.js'
        ),

        // full path to /core
        buildFolderPath: path.join(BUILD_DIRECTORY, config.alias)
      };
    };

    config.files.forEach(file => {
      const info = moduleInfo(file);
      outputs[info.buildFile] = info;
    });
  });

  return outputs;
}

function createBanner(name) {
  return `/**
 * ${name}
 *
 * @author ${pkg.author}
 * @version: ${pkg.version}
 * @license: ${pkg.license}
 **/`;
}

function createRenameImports(pkgs) {
  return type => {
    return Object.values(pkgs).reduce((accum, config) => {
      const src = config.sourceImport.replace('otplib-', '@otplib/');
      accum[src] = path.join('..', config[type]);

      return accum;
    }, {});
  };
}

function createBundleType(type, configGenerator) {
  const pkgs = createPackages();

  return Object.values(pkgs)
    .filter(config => config.bundler === type)
    .map(config =>
      configGenerator(config, {
        BUILD_DIRECTORY,
        EXTENSIONS,
        ROOT_DIRECTORY,
        SOURCE_DIRECTORY,
        createBanner,
        renameImports: createRenameImports(pkgs)
      })
    );
}

module.exports = createBundleType;
