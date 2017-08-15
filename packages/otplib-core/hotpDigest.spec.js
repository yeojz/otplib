import hotpDigest from './hotpDigest';

describe('hotpDigest', function () {
  [
    ['null', null],
    ['undefined', void 0],
    ['not an object', () => 1]
  ].forEach((entry) => {
    it(`should throw an error if options is ${entry[0]}`, function () {
      expect(() => hotpDigest('test', 0, entry[1])).toThrow(Error);
    });
  });
});
