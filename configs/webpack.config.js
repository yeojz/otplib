/* eslint-disable @typescript-eslint/no-var-requires, @typescript-eslint/explicit-function-return-type */
const webpack = require('webpack');
const createBundleType = require('./createBundleType');

const ENV = (process.env.NODE_ENV || 'development').toLowerCase();

function webpackConfig(config, helpers) {
  return {
    mode: ENV === 'production' ? ENV : 'development',
    entry: {
      otplib: config.sourceFilePath
    },
    output: {
      library: '[name]',
      libraryTarget: config.format,
      path: config.buildFolderPath,
      filename: config.buildFileName
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
      alias: helpers.renameImports('sourceImport'),
      extensions: helpers.EXTENSIONS
    },
    plugins: [
      new webpack.DefinePlugin({
        'process.env.NODE_ENV': JSON.stringify(ENV)
      }),
      new webpack.BannerPlugin({
        banner: helpers.createBanner(config.sourceImport),
        raw: true
      })
    ],
    devtool: 'cheap-module-source-map',
    target: 'web'
  };
}

module.exports = createBundleType('webpack', webpackConfig);
