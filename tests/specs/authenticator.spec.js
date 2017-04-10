import {expect} from 'chai';
import authenticator from 'src/authenticator';
import * as lib from 'src/authenticator';
import Authenticator from 'src/classes/Authenticator';

describe('authenticator', function () {
  it('should expose authenticator class', function () {
    expect(lib.Authenticator).to.be.a.function;
  });

  it('should expose an instance of Authenticator', function () {
    expect(authenticator).to.be.an.instanceOf(Authenticator);
  });
});
