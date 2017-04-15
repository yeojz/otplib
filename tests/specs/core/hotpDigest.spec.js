import {expect} from 'chai';
import hotpDigest from 'src/core/hotpDigest';

describe('core/hotpDigest', function () {
  [
    ['null', null],
    ['undefined', void 0],
    ['not an object', () => 1]
  ].forEach((entry) => {
    it(`should throw an error if options is ${entry[0]}`, function () {
      expect(() => hotpDigest('test', 0, entry[1])).to.throw(Error);
    });
  });
});
