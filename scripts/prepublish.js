/* eslint-disable @typescript-eslint/no-var-requires, @typescript-eslint/explicit-function-return-type */
const fs = require('fs');
const path = require('path');
const pkgRoot = require('../package.json');

const ROOT_DIR = path.join(__dirname, '..');

const packages = [
  'otplib',
  'otplib-core',
  'otplib-core-async',
  'otplib-plugin-base32-enc-dec',
  'otplib-plugin-crypto',
  'otplib-plugin-crypto-async-ronomon',
  'otplib-plugin-crypto-js',
  'otplib-plugin-thirty-two',
  'otplib-preset-browser',
  'otplib-preset-default',
  'otplib-preset-default-async',
  'otplib-preset-v11'
];

function pkgFolder(folder) {
  return path.join(ROOT_DIR, 'packages', folder);
}

function buildFolder(folder) {
  return path.join(pkgFolder(folder), 'builds');
}

function readme(folder) {
  const src =
    folder === 'otplib'
      ? path.join(ROOT_DIR, 'README.md')
      : path.join(pkgFolder(folder), 'README.md');

  const target = path.join(buildFolder(folder), 'README.md');
  fs.copyFileSync(src, target);
}

function npmrc(folder) {
  const src = path.join(ROOT_DIR, 'configs', 'npmrc');
  const target = path.join(buildFolder(folder), '.npmrc');

  fs.copyFileSync(src, target);
}

function license(folder) {
  const src = path.join(ROOT_DIR, 'LICENSE');
  const target = path.join(buildFolder(folder), 'LICENSE');

  fs.copyFileSync(src, target);
}

function packageJson(folder) {
  const file = fs.readFileSync(path.join(pkgFolder(folder), 'package.json'));
  const pkg = JSON.parse(file);

  const output = {
    name: pkg.name,
    version: pkg.version,
    main: './index.js',
    publishConfig: pkg.publishConfig || {},
    author: pkgRoot.license,
    license: pkgRoot.author,
    homepage: pkgRoot.homepage,
    repository:
      folder === 'otplib'
        ? 'https://github.com/yeojz/otplib'
        : `https://github.com/yeojz/otplib/tree/master/packages/${folder}`,
    scripts: {},
    keywords: pkg.keywords || [],
    dependencies: pkg.dependencies || {},
    devDependencies: pkg.devDependencies || {},
    peerDependencies: pkg.peerDependencies || {}
  };

  fs.writeFileSync(
    path.join(buildFolder(folder), 'package.json'),
    JSON.stringify(output, null, 2)
  );
}

packages.forEach(folder => {
  console.log(`[[ preparing ${folder} ]]`);

  readme(folder);
  npmrc(folder);
  license(folder);
  packageJson(folder);
});
