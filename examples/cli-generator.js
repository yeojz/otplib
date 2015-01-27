/*
 *  Sample Token and Secret Generation
 *  Command Line
 */



var otp = require('../src'),
    secret = '';

otp.google.debug(true);


function getOTP(){
  otp.google.generate(secret);
}


function getTimer(){
    var epoch = Math.floor(new Date().getTime() / 1000.0);
    // var countDown = 30 - (epoch % 30);

    if (epoch % 30 === 0){
      console.log('');
      getOTP();
    }

    process.stdout.write(".");
}



// Generate a random secret: otp.google.secret();
var secret = otp.google.secret(),
    qrcode = otp.google.qrcode('user@localhost', 'myservice', secret);


console.log('\n Secret : ' + secret);
console.log('\n QR Code : ' + qrcode);
console.log("");



getOTP();
setInterval(getTimer, 1000);
