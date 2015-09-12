/**
 * Sample token check against system generated token.
 *
 * @since 3.0.0
 */



var prompt = require('prompt');
var otp = require('../lib/authenticator');

var verified = false;
var secret = '';










// Init Prompt
// --------------------------------------------------------
prompt.message = '[input]'.grey;
prompt.delimiter = ': ';
prompt.start();






// Helpers
// --------------------------------------------------------
function timeNow(){
  return (new Date()).toTimeString().replace(/( GMT.+)/, '');
}

// Recursive Function
function checker() {

  prompt.get({
    properties: {
      otp: {
        description: '[Enter your OTP]'.magenta
      }
    }
  }, function(err, result) {

    if (err){
      console.error(err);
      return;
    }

    var otpInput = result.otp;

    if (otpInput === 'q'){
      return;
    }

    var systemToken = '';
    var time = '[' + timeNow() + ']';

    systemToken = otp.generate(secret);

    verified = otp.check(otpInput, secret);
    verified = (verified) ? 'OK'.green : 'NOT OK'.red;

    console.log(time.grey, '[System Token]'.yellow, systemToken);
    console.log(time.grey, '[Status]'.yellow, verified);

    // recurse
    checker();
  });
}










// Start
// --------------------------------------------------------
prompt.get({
  properties: {
    secret: {
      description: '[otp secret]'.green,
      hidden: true
    }
  }
}, function (err, result) {
  if (err){
    console.error(err);
    return;
  }

  // Formats secret
  secret = otp.utils.removeSpaces(result.secret);

  // Start Checker Process
  checker();
});






