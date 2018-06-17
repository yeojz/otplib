/**
 * Before use, from the project root, run:
 * $> npm install
 * $> npm run build
 *
 * Usage:
 * $> node examples/cli.js --step=30 --secret=HF4XKUTHKFKDC4KTIZGXMZJXKU3E4SC
 *
 * Supported config:
 * --step
 * --epoch
 * --secret or --privatekey (if your key is not encoded yet)
 */
const otplib = require('../dist/otplib');

let currToken = '';
let secret = '';

// Parse and prepare CLI values
function getCommandLineOptions() {
  return process.argv
    .slice(2)
    .map(arg => arg.split('='))
    .reduce((accum, arg) => {
      const key = arg[0].replace('--', '');

      // if secret, do not put in config
      if (key === 'secret') {
        secret = arg[1];
        return accum;
      }

      // If provided key is not encoded, encode it first
      // do not put in config
      if (key === 'privatekey') {
        secret = otplib.authenticator.encode(arg[1]);
        return accum;
      }

      if (key === 'step' || key === 'epoch') {
        accum[key] = parseInt(arg[1], 10);
        return accum;
      }

      return accum;
    }, {});
}

function codeGenerator() {
  // This represents the start of a new period
  // The alternative would be when authenticator.timeRemaining() === step
  if (otplib.authenticator.timeUsed() === 0) {
    currToken = otplib.authenticator.generate(secret);
  }

  const timeRemaining = otplib.authenticator.timeRemaining();

  process.stdout.clearLine();
  process.stdout.cursorTo(0); // move cursor to beginning of line
  process.stdout.write('[' + timeRemaining + 's] - ' + currToken);
}

otplib.authenticator.options = getCommandLineOptions();
currToken = otplib.authenticator.generate(secret);
setInterval(codeGenerator, 1000);
