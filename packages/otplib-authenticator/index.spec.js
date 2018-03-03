import authenticator from './index';
import Authenticator from './Authenticator';

describe('index', () => {
  it('should expose authenticator class', () => {
    expect(authenticator.Authenticator).toEqual(Authenticator);
  });

  it('should expose an instance of Authenticator', () => {
    expect(authenticator).toBeInstanceOf(Authenticator);
  });
});
