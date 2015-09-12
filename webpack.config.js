
/* Library
 * -------------------------------------------------------- */
var path = require('path');
var webpack = require('webpack');




/* Variables
 * -------------------------------------------------------- */
var ENV = process.env.NODE_ENV;




/* Folders
 * -------------------------------------------------------- */
var ROOT_FOLDER = path.resolve(__dirname);
var SOURCE_FOLDER = path.join(ROOT_FOLDER, 'src');
var BUILD_FOLDER = path.join(ROOT_FOLDER, 'dist/browser');





/* Options List
 * -------------------------------------------------------- */

/* Entries
 * ------------------ */
var entries = {
  'otplib': SOURCE_FOLDER + '/index.js',
  'otplib.ga': SOURCE_FOLDER + '/authenticator.js',
  'otplib.hotp': SOURCE_FOLDER + '/hotp.js',
  'otplib.totp': SOURCE_FOLDER + '/totp.js',
  'otplib.legacy': SOURCE_FOLDER + '/v2.js'
};


/* Output
 * ------------------ */
var outputs = {
  library: 'otplib',
  libraryTarget: 'umd',
  path: BUILD_FOLDER,
  filename: '[name].js'
};


/* Loaders
 * ------------------ */
var loaders = [];
loaders.push({
  test: /\.js?$/,
  loaders: ['babel'],
  exclude: /node_modules/
});


/* Plugins
 * ------------------ */
var plugins = [];
plugins.push(new webpack.DefinePlugin({'process.env': {'NODE_ENV': JSON.stringify(ENV)}}));
// plugins.push(new webpack.NoErrorsPlugin());


/* Modifications
 * ------------------ */
if (ENV === 'production'){
  plugins.push(new webpack.optimize.UglifyJsPlugin({
    compress: {warnings: false}
  }));
}






/* Configuration Options
 * -------------------------------------------------------- */
var config = {

  entry: entries,
  output: outputs,

  module: {
    loaders: loaders
  },

  plugins: plugins
};

module.exports = config;

