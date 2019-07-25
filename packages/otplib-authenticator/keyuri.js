const data = '{service}:{user}?secret={secret}&issuer={service}&algorithm={algorithm}&digits={digits}&period={period}';

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
 * @param {object} options - additional options.
 * @return {string} otpauth uri. Example: otpauth://totp/user:localhost?secret=NKEIBAOUFA
 */
function keyuri(user, service, secret, options) {
  const protocol = 'otpauth://totp/';
  const value = data
    .replace('{user}', encodeURIComponent(user))
    .replace('{secret}', secret)
    .replace(/{service}/g, encodeURIComponent(service))
    .replace('{algorithm}', options.algorithm)
    .replace('{digits}', options.digits)
    .replace('{period}', options.step);

  return protocol + value;
}

export default keyuri;
