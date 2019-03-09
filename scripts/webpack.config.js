const webpack = require('webpack');

const aliases = require('./helpers/aliases');
const createBanner = require('./helpers/createBanner');
const directory = require('./helpers/directory');
const buildConfig = require('../build.config');

const ENV = (process.env.NODE_ENV || 'development').toLowerCase();

const PACKAGE_LIST = Object.keys(buildConfig).filter(
  name => buildConfig[name].bundler === 'webpack'
);

function webpackConfig(name, config) {
  return {
    // mode: ENV === 'production' ? ENV : 'development',
    entry: {
      otplib: directory.SOURCE + '/otplib-browser/index.js'
    },
    output: {
      library: '[name]',
      libraryTarget: 'umd',
      path: directory.BUILD,
      filename: name + '.js'
    },
    module: {
      rules: [
        {
          test: /\.js?$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: config.babel
          }
        }
      ]
    },
    resolve: {
      alias: aliases
    },
    plugins: [
      new webpack.DefinePlugin({
        'process.env.NODE_ENV': JSON.stringify(ENV)
      }),
      new webpack.BannerPlugin({
        banner: createBanner(name),
        raw: true
      })
    ],
    devtool: 'cheap-module-source-map',
    target: 'web'
  };
}

const list = PACKAGE_LIST.map(name => {
  const config = buildConfig[name];
  return webpackConfig(name, config);
});

module.exports = list;
