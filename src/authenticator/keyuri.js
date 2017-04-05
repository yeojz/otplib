/**
 * Generates an otpauth uri
 *
 * @method keyuri
 *
 * @param {string} user - the name/id of your user
 * @param {string} service - the name of your service
 * @param {string} secret - your secret that is used to generate the token
 * @return {string} otpauth uri. Example: otpauth://totp/user:localhost?secet=NKEIBAOUFA
 */
function keyuri(user = 'user', service = 'service', secret = '') {
  const protocol = 'otpauth://totp/';

  let data = '%service:%user?secret=%secret&issuer=%service';
  data = data.replace('%user', user);
  data = data.replace('%secret', secret);
  data = data.replace(/%service/g, service);

  return encodeURIComponent(protocol + data);
}

export default keyuri;
