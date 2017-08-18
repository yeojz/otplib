import authenticator from './index';
import Authenticator from './Authenticator';

describe('index', function () {
  it('should expose authenticator class', function () {
    expect(authenticator.Authenticator).toEqual(Authenticator);
  });

  it('should expose an instance of Authenticator', function () {
    expect(authenticator).toBeInstanceOf(Authenticator);
  });
});
