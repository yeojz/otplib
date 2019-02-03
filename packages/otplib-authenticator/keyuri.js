const data = '{service}:{user}?secret={secret}&issuer={service}';

/**
 * Generates an otpauth uri
 *
 * The "user" and "service" parameters will
 * be passed to encodeURIComponent for encoding
 *
 * @namespace otplib/impl/authenticator
 * @module otplib-authenticator/keyuri
 * @param {string} user - the name/id of your user
 * @param {string} service - the name of your service
 * @param {string} secret - your secret that is used to generate the token
 * @return {string} otpauth uri. Example: otpauth://totp/user:localhost?secret=NKEIBAOUFA
 */
function keyuri(user = 'user', service = 'service', secret = '') {
  const protocol = 'otpauth://totp/';
  const value = data
    .replace('{user}', encodeURIComponent(user))
    .replace('{secret}', secret)
    .replace(/{service}/g, encodeURIComponent(service));

  return protocol + value;
}

export default keyuri;
