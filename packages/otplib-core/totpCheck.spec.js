import totpCheck from './totpCheck';
import totpToken from './totpToken';

jest.mock('./totpToken', () => jest.fn());

describe('totpCheck', function () {

  const secret = 'i6im0gc96j0mn00c';
  const token = '923066';

  it('should return true', function () {
    totpToken.mockImplementation(() => token);
    const result = totpCheck(token, secret, {});

    expect(result).toBe(true);
  });

  it('should return false if systemToken is empty', function () {
    totpToken.mockImplementation(() => '');
    const result = totpCheck(token, secret, {});

    expect(result).toBe(false);
  });

  it('should passthrough object options to totpToken when null', function () {
    totpToken.mockImplementation(() => '');
    totpCheck(token, secret, null);

    expect(totpToken).toHaveBeenCalledTimes(1);
    expect(totpToken).toHaveBeenCalledWith(secret, {});
  });

  it('should passthrough object options to totpToken when undefined', function () {
    totpToken.mockImplementation(() => '');
    totpCheck(token, secret);

    expect(totpToken).toHaveBeenCalledTimes(1);
    expect(totpToken).toHaveBeenCalledWith(secret, {});
  });
});
