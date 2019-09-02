/* eslint-disable @typescript-eslint/no-var-requires, @typescript-eslint/explicit-function-return-type */
const fs = require('fs');
const path = require('path');
const basePkg = require('../package.json');
const buildConfig = require('./builds');

const ROOT_DIRECTORY = path.join(__dirname, '..');
const BUILD_DIRECTORY = path.join(ROOT_DIRECTORY, 'builds', 'packages');
const SOURCE_DIRECTORY = path.join(ROOT_DIRECTORY, 'packages');

function readPackageJSON(...paths) {
  try {
    const contents = fs.readFileSync(path.join(...paths, 'package.json'));
    return JSON.parse(contents);
  } catch (err) {
    return {};
  }
}

function createBanner(name, pkg) {
  return `/**
 * ${name}
 *
 * @author ${pkg.author}
 * @version: ${pkg.version}
 * @license: ${pkg.license}
 **/`;
}

function createPackages() {
  const outputs = {};

  Object.keys(buildConfig).forEach(name => {
    const config = buildConfig[name];

    const modulePkg = {
      author: basePkg.author,
      license: basePkg.license,
      version: basePkg.version,
      ...readPackageJSON(SOURCE_DIRECTORY, name)
    };

    const sources = config.files || [];

    sources.forEach(source => {
      const sourceFile = path.join(name, source);
      const buildFile = path.join(
        name,
        source.replace('src/', '').replace(/.ts$/, '.js')
      );

      outputs[buildFile] = {
        banner: createBanner(
          buildFile.replace(/\/index.js$/, '').replace(/.js$/, ''),
          modulePkg
        ),
        buildFile,
        buildFilePath: path.join(BUILD_DIRECTORY, buildFile),
        bundler: config.bundler,
        extensions: ['.js', '.ts'],
        external: [
          'crypto',
          ...Object.keys(modulePkg.dependencies || {}),
          ...Object.keys(modulePkg.devDependencies || {}),
          ...sources
        ],
        format: config.format,
        presetEnv: config.presetEnv || {},
        sourceFile,
        sourceFilePath: path.join(SOURCE_DIRECTORY, sourceFile)
      };
    });
  });

  return outputs;
}

exports.createBundleType = (type, configGenerator) => {
  const pkgs = createPackages();

  return Object.values(pkgs)
    .filter(config => config.bundler === type)
    .map(config => configGenerator(config));
};

exports.createPackageJSON = () => {
  // fs.writeFileSync(
  //   path.join(BUILD_DIRECTORY, name, 'package.json'),
  //   JSON.stringify(pkg, null, 2)
  // );
};
