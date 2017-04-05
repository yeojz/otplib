import {expect} from 'chai';
import index from 'src/index';
import Authenticator from 'src/classes/Authenticator';
import HOTP from 'src/classes/HOTP';
import TOTP from 'src/classes/TOTP';

describe('index', function () {
  it('should expose instances of classes', function () {
    expect(index.hotp).to.be.an.instanceOf(HOTP);
    expect(index.totp).to.be.an.instanceOf(TOTP);
    expect(index.authenticator).to.be.an.instanceOf(Authenticator);
  });
});
