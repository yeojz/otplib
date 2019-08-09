/* eslint-disable @typescript-eslint/no-var-requires */
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
    // externals: {
    //   Buffer: {
    //     root: 'buffer.Buffer'
    //   }
    // },
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
              presets: [
                '@babel/preset-typescript',
                ['@babel/preset-env', { modules: false, ...config.presetEnv }]
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
