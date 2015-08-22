/**
 * Sample Google Authenticator compatible token generator.
 *
 * @since 3.0.0
 */



var authenticator = require('../lib/authenticator');
var prompt = require('prompt');





// Init Prompt
// --------------------------------------------------------
prompt.message = '[input]'.grey;
prompt.delimiter = ': ';
prompt.start();





// Variables
// --------------------------------------------------------
var secret = '';
var schema = {
  properties: {
    secret: {
      description: '[otp secret]'.green,
      hidden: true
    }
  }
};




// Helpers
// --------------------------------------------------------
function timeNow(){
  return (new Date()).toTimeString().replace(/( GMT.+)/, '');
}


function generate(){
  var token = authenticator.generate(secret);
  var time = timeNow();
  time = '[' + time + ']';

  console.log(time.grey, token);
}


function timer(){
  var time = new Date().getTime();
  var epoch = Math.floor(time / 1000.0);
  // var countDown = 30 - (epoch % 30);

  if (epoch % 30 === 0){
    console.log('');
    generate();
  }

  process.stdout.write('.');
}





// Start
// --------------------------------------------------------
prompt.get(schema, function(err, result) {
  if (err){
    console.log(err);
  }

  secret = result.secret;
  generate();
  setInterval(timer, 1000);
});


