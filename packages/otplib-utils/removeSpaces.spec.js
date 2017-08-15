import removeSpaces from './removeSpaces';

describe('removeSpaces', function () {
  const val = ' a   ';

  it('should strip spaces', function () {
    expect(val).not.toEqual('a');
    expect(removeSpaces(val)).toEqual('a');
  });

  it('should return empty string', function () {
    expect(removeSpaces()).toEqual('');
    expect(removeSpaces(null)).toEqual('');
    expect(removeSpaces(void 0)).toEqual('');
  });
});
