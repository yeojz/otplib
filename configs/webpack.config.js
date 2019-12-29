/* eslint-disable @typescript-eslint/no-var-requires, @typescript-eslint/explicit-function-return-type */
const path = require('path');
const webpack = require('webpack');
const helpers = require('./helpers');

const ENV = (process.env.NODE_ENV || 'development').toLowerCase();
const CWD = process.cwd();
const pkg = helpers.packageJSON(CWD);

function webpackConfig(file) {
  return {
    mode: ENV === 'production' ? ENV : 'development',
    entry: {
      otplib: path.join(CWD, file)
    },
    output: {
      library: '[name]',
      libraryTarget: 'umd',
      path: helpers.outputDirectory(CWD),
      filename: helpers.fileNameNoExt(file) + '.js'
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
                [
                  '@babel/preset-env',
                  { modules: false, targets: 'cover 99.5%' }
                ],
                '@babel/preset-typescript'
              ]
            }
          }
        }
      ]
    },
    resolve: {
      extensions: helpers.EXTENSIONS,
      modules: [path.join(helpers.ROOT_DIR, 'node_modules'), 'node_modules']
    },
    plugins: [
      new webpack.DefinePlugin({
        'process.env.NODE_ENV': JSON.stringify(ENV)
      }),
      new webpack.BannerPlugin({
        banner: helpers.banner(pkg),
        raw: true
      })
    ],
    devtool: 'cheap-module-source-map',
    target: 'web'
  };
}

module.exports = helpers.packageFiles(pkg).map(webpackConfig);
