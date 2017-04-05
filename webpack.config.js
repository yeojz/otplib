let path = require('path');
let webpack = require('webpack');
var ENV = process.env.NODE_ENV;

let ROOT_FOLDER = path.resolve(__dirname);
let SOURCE_FOLDER = path.join(ROOT_FOLDER, 'src');
let BUILD_FOLDER = path.join(ROOT_FOLDER, 'site/public');

module.exports = {
  entry: {
    'otplib': SOURCE_FOLDER + '/index.js',
    'otplib.ga': SOURCE_FOLDER + '/authenticator.js',
    'otplib.hotp': SOURCE_FOLDER + '/hotp.js',
    'otplib.totp': SOURCE_FOLDER + '/totp.js',
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
  plugins: [
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(ENV)
    }),
    new webpack.optimize.UglifyJsPlugin({
      compress: {
        warnings: false
      }
    })
  ]
};
