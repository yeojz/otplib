import * as core from 'otplib-core';
import check from './check';
import decodeKey from './decodeKey';

jest.mock('./decodeKey', () => jest.fn());

describe('check', function () {
  it('should call and return value from totpToken', function () {
    const token = '123456';
    const secret = 'GEZDGNBVGY3TQOJQGEZDG';
    const options = { test: 'test' }

    const spy = jest.spyOn(core, 'totpCheck')
      .mockImplementation(() => jest.fn());

    decodeKey.mockImplementation(() => 'decode');

    check(token, secret, options)

    expect(decodeKey.mock.calls[0]).toEqual(['GEZDGNBVGY3TQOJQGEZDG']);
    expect(spy).toHaveBeenCalled();
    expect(spy.mock.calls).toHaveLength(1);
    expect(spy.mock.calls[0]).toEqual([token, 'decode', options]);
  });
});
