import {expect} from 'chai';
import rfc6238 from 'tests/helpers/rfc6238';
import hotpCounter from 'src/core/hotpCounter';
import totpCounter from 'src/core/totpCounter';
import totpToken from 'src/core/totpToken';

describe('RFC 6238', function () {
  rfc6238.table.forEach((row) => {

    const id = `${row.algorithm} / ${row.epoch}`;

    it(`[${id}] expected counter value`, function () {
      const counter = hotpCounter(totpCounter(row.epoch * 1000, rfc6238.step));
      expect(counter.toUpperCase()).to.equal(row.counter);
    });

    it(`[${id}] ${row.token} token`, function () {
        const result = totpToken(rfc6238.secret, {
          algorithm: row.algorithm,
          digits: 8,
          epoch: row.epoch,
          step: 30
        });
        expect(result).to.equal(row.token);
    });
  });
});
