import createHmac from 'create-hmac/browser';
import randomBytes from './randomBytes';

/**
  * Crypto replacement for browser
  *
  * @module otplib-browser/crypto
  */
export default {
  createHmac,
  randomBytes
}
