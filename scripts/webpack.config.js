const webpack = require('webpack');

const aliases = require('./helpers/aliases');
const createBanner = require('./helpers/createBanner');
const directory = require('./helpers/directory');

const ENV = (process.env.NODE_ENV || 'development').toLowerCase();

const babelOverrides = {
  presets: [
    [
      'env',
      {
        targets: {
          browsers: ['last 5 versions']
        }
      }
    ]
  ]
};

module.exports = {
  mode: ENV === 'production' ? ENV : 'development',
  entry: {
    otplib: directory.SOURCE + '/otplib-browser/index.js'
  },
  output: {
    library: '[name]',
    libraryTarget: 'umd',
    path: directory.BUILD,
    filename: 'otplib-browser.js'
  },
  module: {
    rules: [
      {
        test: /\.js?$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: babelOverrides
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
      banner: createBanner('otplib-browser'),
      raw: true
    })
  ],
  devtool: 'cheap-module-source-map',
  target: 'web'
};
