import {expect} from 'chai';
import removeSpaces from 'src/utils/removeSpaces';

describe('utils/removeSpaces', function () {
  const val = ' a   ';

  it('should strip spaces', function () {
    expect(val).to.not.equal('a');
    expect(removeSpaces(val)).to.equal('a');
  });

  it('should return empty string', function () {
    expect(removeSpaces()).to.equal('');
    expect(removeSpaces(null)).to.equal('');
    expect(removeSpaces(void 0)).to.equal('');
  });
});
