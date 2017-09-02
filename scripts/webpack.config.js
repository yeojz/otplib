const webpack = require('webpack');

const aliases = require('./helpers/aliases');
const createBanner = require('./helpers/createBanner');
const directory = require('./helpers/directory');

const ENV = process.env.NODE_ENV;

module.exports = {
  entry: {
    'otplib': directory.SOURCE + '/otplib-browser/index.js'
  },
  output: {
    library: '[name]',
    libraryTarget: 'umd',
    path: directory.BUILD,
    filename: 'otplib-browser.js'
  },
  module: {
    rules: [{
      test: /\.js?$/,
      exclude: /node_modules/,
      use: [
        'babel-loader',
      ]
    }]
  },
  resolve: {
    alias: aliases
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(ENV)
    }),
    new webpack.optimize.UglifyJsPlugin({
      compress: {
        warnings: false
      }
    }),
    new webpack.BannerPlugin({
      banner: createBanner('otplib-browser'),
      raw: true
    })
  ],
  devtool: 'cheap-module-source-map',
  target: 'web'
};
