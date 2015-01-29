var expect = require('expect.js');

console.log("  Classification: ");
console.log("     [Assurance] = Backward Compatibility");
console.log("     [.method] = Method that is tested");

describe('otplib', function(){

  var otplib = '';


  // pass
  var passSet = [
    ['i6im0gc96j0mn00c', 47412420, 196182],
    ['65jh84eo38k32edm', 47412423, 963234],
    ['f4515l6ob3gkganp', 47412433, 415572],
    ['2o9989k76ij7eh9c', 47412435, 343659]
  ];


  // Fail
  var failSet = [
    ['9821741871231', 1078968, 'Should fail'],
    ['18748612', 982671, '18748612'],
    ['18748612', 982671, 125832],
  ];




  beforeEach(function(){ 
    otplib = require('../src');
  });
  

  afterEach(function(){ 
    otplib = '';
  });


  it('[Assurance] Ensure important entry methods exist', function(){
    
    // Module Exports
    expect(otplib).to.be.an('object');
    expect(otplib.google).to.be.an('object');
    expect(otplib.core).to.be.an('object');

    // Core
    expect(otplib.core.totp).to.be.an('function');
    expect(otplib.core.hotp).to.be.an('function');

    expect(otplib.core.checkTOTP).to.be.an('function');
    expect(otplib.core.checkHOTP).to.be.an('function');

    // Google
    expect(otplib.google.generate).to.be.an('function');
    expect(otplib.google.secret).to.be.an('function');
    expect(otplib.google.check).to.be.an('function');
  });


  it('[core.hotp] Ensure correct code generation', function(){

    for (var i in passSet){
      expect(otplib.core.hotp(passSet[i][0], passSet[i][1])).to.be.eql(passSet[i][2]);      
    }

    for (var i in failSet){
      expect(otplib.core.hotp(failSet[i][0], failSet[i][1])).to.not.eql(failSet[i][2]);      
    }

  });


  it('[core.checkHOTP]', function(){

    for (var i in passSet){
      expect(otplib.core.checkHOTP(passSet[i][2], passSet[i][0], passSet[i][1])).to.be.eql(true);      
    }
    
    for (var i in failSet){
      expect(otplib.core.checkHOTP(failSet[i][2], failSet[i][0], failSet[i][1])).to.be.eql(false);      
    }
  });


  it('[core.checkTOTP]', function(){
    var key = 972213;

    otplib.core.test = true;
    
    expect(otplib.core.checkTOTP(key, '12341234123412341234', 59*1000)).to.be.eql(true);
    expect(otplib.core.checkTOTP(key+1, '12341234123412341234', 59*1000)).to.be.eql(false);
  });
  

  it('[core.secret.generate] Should generate secret of specified length', function(){
    expect(otplib.core.secret.generate(-1).length).to.be.eql(0);

    expect(otplib.core.secret.generate().length).to.be.eql(16);

    expect(otplib.core.secret.generate(1).length).to.be.eql(1);
    expect(otplib.core.secret.generate(8).length).to.be.eql(8);
    expect(otplib.core.secret.generate(128).length).to.be.eql(128);
  });


  it('[ga.secret] Should generate secret of specified length', function(){
    expect(otplib.google.secret(-1).length).to.be.eql(0);

    expect(otplib.google.secret().length).to.be.eql(16);

    expect(otplib.google.secret(1).length).to.be.eql(1);
    expect(otplib.google.secret(8).length).to.be.eql(8);
    expect(otplib.google.secret(128).length).to.be.eql(128);
  });


  it('[google.generate] Ensure correct token length', function(){

    // Secret length between 10 and 50
    function secret(){
      var length = (Math.random() *  39 + 10).toString(10).slice(0,2);
      return Math.random().toString(25).slice(2, length);
    }

    for (var i = 0; i < 6; i++) {
      expect(otplib.google.generate(secret()).length).to.be.eql(6);  
    }

  });
  

});


