const path = require('path');
const webpack = require('webpack');

const ENV = process.env.NODE_ENV;
const BUILD_FOLDER = path.resolve(process.env.BUILD_FOLDER || 'dist');
const ROOT_FOLDER = path.resolve(__dirname);
const SOURCE_FOLDER = path.join(ROOT_FOLDER, 'src');

module.exports = {
  entry: {
    'otplib': SOURCE_FOLDER + '/index.js',
    'otplib.hotp': SOURCE_FOLDER + '/hotp.js',
    'otplib.totp': SOURCE_FOLDER + '/totp.js',
    'otplib.ga': SOURCE_FOLDER + '/authenticator.js',
    'otplib.legacy': SOURCE_FOLDER + '/v2.js'
  },
  output: {
    library: 'otplib',
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
    alias: {
      'crypto': path.resolve(ROOT_FOLDER, 'src', 'utils', 'crypto')
    }
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(ENV)
    }),
    new webpack.optimize.CommonsChunkPlugin({
      name: 'commons',
      filename: 'otplib.commons.js',
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
