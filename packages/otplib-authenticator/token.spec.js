import * as core from 'otplib-core';
import decodeKey from './decodeKey';
import token from './token';

jest.mock('./decodeKey', () => jest.fn());

describe('token', function () {
  it('should return expected result', function () {
    decodeKey.mockImplementation(() => 10);

    const totpToken = jest.spyOn(core, 'totpToken')
      .mockImplementation(() => 'result');

    const options = { test: 1 };

    token('test', options);

    expect(decodeKey.mock.calls[0]).toEqual(['test']);
    expect(totpToken.mock.calls[0]).toEqual([10, options]);
  });
});
