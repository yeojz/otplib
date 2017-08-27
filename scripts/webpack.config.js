const path = require('path');
const webpack = require('webpack');
const directory = require('./directory');
const packages = require('./packages');

const ENV = process.env.NODE_ENV;

const aliases = Object.keys(packages).reduce((accum, name) => {
  accum[name] = path.join(directory.SOURCE, name, 'index.js');
  return accum;
}, {});

module.exports = {
  entry: {
    'otplib': directory.SOURCE + '/otplib-browser/index.js'
  },
  output: {
    library: '[name]',
    libraryTarget: 'umd',
    path: directory.TARGET,
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
