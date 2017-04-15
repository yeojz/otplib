import {expect} from 'chai';
import index from 'src/core/index';

describe('core/index', function () {
  it('should expose core methods', function () {
    expect(index.hotpCheck).to.be.a.function;
    expect(index.hotpCounter).to.be.a.function;
    expect(index.hotpDigest).to.be.a.function;
    expect(index.hotpOptions).to.be.a.function;
    expect(index.hotpSecret).to.be.a.function;
    expect(index.hotpToken).to.be.a.function;
    expect(index.totpCheck).to.be.a.function;
    expect(index.totpOptions).to.be.a.function;
    expect(index.totpSecret).to.be.a.function;
    expect(index.totpToken).to.be.a.function;
  });
});
