import keyuri from './keyuri';
/**
 * Generates a QR Code image
 *
 * By default, it uses Google Charts as it's charting tool
 *
 * @method qrcode
 *
 * @param {string} user - the name/id of your user
 * @param {string} service - the name of your service
 * @param {string} secret - your secret that is used to generate the token
 * @return {string} the QR code image url
 */
function qrcode(user, service, secret, options = {}) {
  const opt = {
    chart: 'https://chart.googleapis.com/chart?cht=qr&chs=150x150&choe=UTF-8&chld=M|0&chl=%uri',
    ...options
  }

  const uri = keyuri(user, service, secret);
  return opt.chart.replace('%uri', uri);
}

export default qrcode;
