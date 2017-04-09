import {expect} from 'chai';
import hotpDigest from 'src/core/hotpDigest';

describe('core/hotpDigest', function () {
  it('should throw an error if options is null or not an object', function () {
    expect(() => hotpDigest('test', 0)).to.throw(Error);
    expect(() => hotpDigest('test', 0, void 0)).to.throw(Error);
    expect(() => hotpDigest('test', 0, null)).to.throw(Error);
  });
});
