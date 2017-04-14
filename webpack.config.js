const path = require('path');
const webpack = require('webpack');

const ENV = process.env.NODE_ENV;
const BUILD_FOLDER = path.resolve(process.env.BUILD_FOLDER || 'dist');
const ROOT_FOLDER = path.resolve(__dirname);
const SOURCE_FOLDER = path.join(ROOT_FOLDER, 'compat');

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
