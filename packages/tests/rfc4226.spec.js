import crypto from 'crypto';
import {hotpDigest, hotpToken} from 'otplib-core';
import rfc4226 from './rfc4226';

describe('RFC 4226', function () {

  rfc4226.digests.forEach((digest, counter) => {
    test(`[${counter}] expected intermediate HMAC value`, function () {
      const result = hotpDigest(rfc4226.secret, counter, {
        crypto,
        encoding: 'ascii',
        algorithm: 'sha1'
      });

      expect(result).toBe(digest);
    });
  });

  rfc4226.tokens.forEach((token, counter) => {
    test(`[${counter}] ${token} token`, function () {
      const result = hotpToken(rfc4226.secret, counter, {
        crypto
      });

      expect(result).toBe(token);
    });
  });
});
