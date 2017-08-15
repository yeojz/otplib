import * as lib from './index';
import authenticator from './index';
import Authenticator from './Authenticator';

describe('index', function () {
  it('should expose authenticator class', function () {
    expect(typeof lib.Authenticator).toEqual('function');
  });

  it('should expose an instance of Authenticator', function () {
    expect(authenticator).toBeInstanceOf(Authenticator);
  });
});
