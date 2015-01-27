/*
 *  Sample Token Checking
 *  Command Line
 *
 *  Requires "prompt" pacakge if running this file
 *  `npm install prompt`
 */


var prompt = require('prompt'),
    otp = require('../src'),
    verified = false,
    secret = '';


otp.google.debug(false);

prompt.start();


function getOTP() {
  console.log("\nEnter Your OTP:");
  prompt.get(['OTP'], function (err, result) {

    console.log('');

    if (err){ return; }

    if (result.OTP !== 'q'){

      // verify
      console.log(' System Token : ' + otp.google.generate(secret));
      verified = otp.google.check(result.OTP, secret);

      console.log("\n Verification Status : "+ verified);
      // recurse
      getOTP();

    } else {
      return;
    }
  });
}



console.log("\nEnter Your Secret:");
prompt.get(['secret'], function (err, result) {
    console.log('Your Secret : ' + result.secret);
    secret = result.secret;

    getOTP();
});
