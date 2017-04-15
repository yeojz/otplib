const path = require('path');
const webpack = require('webpack');

const ENV = process.env.NODE_ENV;
const OTPLIB_WEBPACK = process.env.OTPLIB_WEBPACK || 'false';
const BUILD_FOLDER = path.resolve(process.env.BUILD_FOLDER || 'dist');
const ROOT_FOLDER = path.resolve(__dirname);
const SOURCE_FOLDER = path.join(ROOT_FOLDER, 'compat');

let alias = {};

if (process.env.OTPLIB_WEBPACK_USE_NODE_CRYPTO !== 'true') {
  alias.crypto = path.resolve(ROOT_FOLDER, 'src', 'utils', 'crypto');
}

module.exports = {
  entry: {
    'otplib': SOURCE_FOLDER + '/index.js',
    'otplib_ga': SOURCE_FOLDER + '/authenticator.js',
    'otplib_hotp': SOURCE_FOLDER + '/hotp.js',
    'otplib_legacy': SOURCE_FOLDER + '/v2.js',
    'otplib_totp': SOURCE_FOLDER + '/totp.js',
    'otplib_utils': SOURCE_FOLDER + '/classes/OTPUtils.js'
  },
  output: {
    library: '[name]',
    libraryTarget: 'umd',
    path: BUILD_FOLDER,
    filename: '[name].js'
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
    alias: alias
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(ENV),
      'process.env.OTPLIB_WEBPACK': JSON.stringify(OTPLIB_WEBPACK)
    }),
    new webpack.optimize.CommonsChunkPlugin({
      name: 'otplib_commons'
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
