var expect = require('expect.js');
var otplib = require('../src');


console.log("  Classification: ");
console.log("     [Assurance] = Backward Compatibility");
console.log("     [.method] = method that is tested");


describe('otplib', function(){

  it('[Assurance] Module exports', function(){
    expect(otplib).to.be.an('object');
    expect(otplib.google).to.be.an('object');
    expect(otplib.core).to.be.an('object');
  });

});


describe('otplib.core', function(){

  it('[Assurance] Ensure important methods exist', function(){
    expect(otplib.core.totp).to.be.an('function');
    expect(otplib.core.hotp).to.be.an('function');

    expect(otplib.core.helpers).to.be.an('object');
    expect(otplib.core.token).to.be.an('object');
    expect(otplib.core.secret).to.be.an('object');
  });


  it('[.secret.generate] should generate to specified length', function(){
    expect(otplib.core.secret.generate(1).length).to.be.eql(1);
    expect(otplib.core.secret.generate(8).length).to.be.eql(8);
    expect(otplib.core.secret.generate(16).length).to.be.eql(16);
    expect(otplib.core.secret.generate(128).length).to.be.eql(128);
  });


  it('[.hotp] Ensure correct code generation', function(){
    expect(otplib.core.hotp('i6im0gc96j0mn00c', 47412420)).to.be.eql(196182);    
    expect(otplib.core.hotp('65jh84eo38k32edm', 47412423)).to.be.eql(963234);
    expect(otplib.core.hotp('f4515l6ob3gkganp', 47412433)).to.be.eql(415572);
    expect(otplib.core.hotp('2o9989k76ij7eh9c', 47412435)).to.be.eql(343659);

    expect(otplib.core.hotp('2o9989k76ij7eh9d', 47412435)).to.not.eql(343659);
    expect(otplib.core.hotp('2o9989k76ij7eh9c', 47412436)).to.not.eql(343659);
  });

});


describe('otplib.google', function(){

  it('[.secret] should generate to specified length', function(){
    expect(otplib.google.secret(1).length).to.be.eql(1);
    expect(otplib.google.secret(8).length).to.be.eql(8);
    expect(otplib.google.secret(16).length).to.be.eql(16);
    expect(otplib.google.secret(128).length).to.be.eql(128);
  });

});


