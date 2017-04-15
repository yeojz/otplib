import {expect} from 'chai';
import crypto from 'src/utils/crypto';

describe('utils/crypto', function () {
  it('should expose an object with a used method', function () {
    expect(crypto).to.be.an.object;
    expect(crypto.createHmac).to.be.a.function;
    expect(crypto.randomBytes).to.be.a.function;
  });
});
