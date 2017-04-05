import isSameToken from '../utils/isSameToken';
import totpToken from './totpToken';

/**
 * Checks the provided OTP token against system generated token
 *
 * @method check
 *
 * @param {string} token - the OTP token to check
 * @param {string} secret - your secret that is used to generate the token
 * @param {object} options - options which was used to generate it originally. eg: epoch, steps
 * @return {boolean}
 */
function totpCheck(token, secret, options = {}){
    const systemToken = totpToken(secret, options);
    return isSameToken(token, systemToken);
}

export default totpCheck;
