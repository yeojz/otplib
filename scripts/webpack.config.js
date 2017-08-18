const path = require('path');
const webpack = require('webpack');
const aliases = require('./aliases');

const ENV = process.env.NODE_ENV;
const BUILD_DIR = path.resolve(process.env.BUILD_DIR || 'dist');
const ROOT_DIR = path.resolve(__dirname, '..');
const SOURCE_DIR = path.join(ROOT_DIR, 'packages');


module.exports = {
  entry: {
    'otplib': SOURCE_DIR + '/otplib-browser/index.js'
  },
  output: {
    library: '[name]',
    libraryTarget: 'umd',
    path: BUILD_DIR,
    filename: 'browser.js'
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
    })
  ],
  devtool: 'cheap-module-source-map',
  target: 'web'
};
