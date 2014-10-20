/*
 * otplib - module
 * http://github.com/yeojz/otplib
 *
 * Copyright (c) 2014 Gerald Yeo
 * Licensed under the MIT license.
 *
 */


var core = require('./components/otplib'),
    ga = require('./components/googleAuthenticator');




module.exports = {
  core: core,
  google: ga
};
