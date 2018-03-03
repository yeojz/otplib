import crypto from 'crypto';
import { hotpDigest, hotpToken, hotpOptions } from 'otplib-core';
import rfc4226 from './rfc4226';

describe('RFC 4226', () => {
  rfc4226.digests.forEach((digest, counter) => {
    test(`[${counter}] expected intermediate HMAC value`, () => {
      const result = hotpDigest(
        rfc4226.secret,
        counter,
        hotpOptions({
          crypto,
          encoding: 'ascii',
          algorithm: 'sha1'
        })
      );

      expect(result.toString('hex')).toBe(digest);
    });
  });

  rfc4226.tokens.forEach((token, counter) => {
    test(`[${counter}] ${token} token`, () => {
      const result = hotpToken(
        rfc4226.secret,
        counter,
        hotpOptions({
          crypto
        })
      );

      expect(result).toBe(token);
    });
  });
});
