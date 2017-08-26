import hotpToken from './hotpToken';
import totpCounter from './totpCounter';
import totpOptions from './totpOptions';
import totpToken from './totpToken';

jest.mock('./hotpToken', () => jest.fn());
jest.mock('./totpCounter', () => jest.fn());
jest.mock('./totpOptions', () => jest.fn());

describe('totpToken', function () {
  const counter = 3;
  const defaultOptions = { epoch: 60000 };
  const secret = 'i6im0gc96j0mn00c';

  beforeEach(function () {
    totpCounter.mockImplementation(() => counter);
    totpOptions.mockImplementation((opt) => Object.assign({}, defaultOptions, opt));
  });

  it('throws an error when option is undefined', function () {
    totpToken(secret, void 0);
    expect(hotpToken).toHaveBeenCalledTimes(1);
    expect(hotpToken).toHaveBeenCalledWith(secret, counter, defaultOptions);
  });

  it('throws an error when option is null', function () {
    totpToken(secret, null);
    expect(hotpToken).toHaveBeenCalledTimes(1);
    expect(hotpToken).toHaveBeenCalledWith(secret, counter, defaultOptions);
  });
});
