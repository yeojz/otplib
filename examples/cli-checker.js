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
    generator = '',
    secret = '';


otp.core.debug = true;

prompt.start();


function getOTP() {
  console.log("\nEnter Your OTP:");
  prompt.get(['OTP'], function (err, result) {

    var systoken = '';

    console.log('');

    if (err){ return; }

    if (result.OTP !== 'q'){

      if (generator === '1'){
        // verify
        systoken = otp.core.totp(secret);
        verified = otp.core.token.check(result.OTP, secret, 'totp');

      } else if (generator === '2'){
        systoken = otp.google.generate(secret);
        verified = otp.google.check(result.OTP, secret);        
      }


      console.log(' System Token : ' + systoken);

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

    secret = otp.core.secret.removeSpaces(result.secret);
    console.log('Your Secret : ' + secret);
    

    console.log("\n Core [1] /Google [2]:");
    prompt.get(['generator'], function(err,result){
      
      if (result.generator !== '1' && result.generator !== '2'){
        throw new Error("Invalid Input");
      }
      generator = result.generator;

      getOTP();
    });
    
});
