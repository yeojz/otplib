import {expect} from 'chai';
import rfc4226 from 'tests/helpers/rfc4226';
import hotpDigest from 'src/core/hotpDigest';
import hotpToken from 'src/core/hotpToken';

describe('RFC 4226', function () {

  rfc4226.digests.forEach((digest, counter) => {
    it(`[${counter}] expected intermediate HMAC value`, function () {
      const result = hotpDigest(rfc4226.secret, counter, {
        encoding: 'ascii',
        algorithm: 'sha1'
      });
      expect(result).to.equal(digest);
    });
  });

  rfc4226.tokens.forEach((token, counter) => {
    it(`[${counter}] ${token} token`, function () {
      const result = hotpToken(rfc4226.secret, counter);
      expect(result).to.equal(token);
    });
  });
});
