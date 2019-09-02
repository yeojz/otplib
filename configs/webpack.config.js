/* eslint-disable @typescript-eslint/no-var-requires, @typescript-eslint/explicit-function-return-type */
const path = require('path');
const webpack = require('webpack');
const createBundleType = require('./helpers').createBundleType;

const ENV = (process.env.NODE_ENV || 'development').toLowerCase();

function webpackConfig(config) {
  const output = config.buildFilePath.split(path.sep);

  return {
    mode: ENV === 'production' ? ENV : 'development',
    entry: {
      otplib: config.sourceFilePath
    },
    output: {
      library: '[name]',
      libraryTarget: config.format,
      path: path.sep + path.join(...output.slice(0, -1)),
      filename: output.slice(-1)[0]
    },
    node: {
      Buffer: false
    },
    module: {
      rules: [
        {
          test: /\.(js|ts)?$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              babelrc: false,
              configFile: false,
              presets: [
                ['@babel/preset-env', { modules: false, ...config.presetEnv }],
                '@babel/preset-typescript'
              ]
            }
          }
        }
      ]
    },
    resolve: {
      extensions: config.extensions
    },
    plugins: [
      new webpack.DefinePlugin({
        'process.env.NODE_ENV': JSON.stringify(ENV)
      }),
      new webpack.BannerPlugin({
        banner: config.banner,
        raw: true
      })
    ],
    devtool: 'cheap-module-source-map',
    target: 'web'
  };
}

module.exports = createBundleType('webpack', webpackConfig);
