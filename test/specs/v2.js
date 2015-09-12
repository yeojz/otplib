import {expect} from 'chai';


describe('Legacy Test (2.x.x adapter)', function(){

    let otplib;

    // pass
    let passSet = [
        ['i6im0gc96j0mn00c', 47412420, '196182'],
        ['65jh84eo38k32edm', 47412423, '963234'],
        ['f4515l6ob3gkganp', 47412433, '415572'],
        ['2o9989k76ij7eh9c', 47412435, '343659']
    ];


    // Fail
    let failSet = [
        ['9821741871231', 1078968, 'Should fail'],
        ['18748612', 982671, '18748612'],
        ['18748612', 982671, '125832']
    ];


    beforeEach(() => {
        otplib = require('../../src/v2');
    });


    afterEach(() => {
        otplib = '';
    });


    it('[Core] Ensure entry methods exist', () => {

        expect(otplib).to.be.an('object');
        expect(otplib.core).to.be.an('object');

        expect(otplib.core.totp).to.be.an('function');
        expect(otplib.core.hotp).to.be.an('function');

        expect(otplib.core.checkTOTP).to.be.an('function');
        expect(otplib.core.checkHOTP).to.be.an('function');
    });


    it('[GA] Ensure entry methods exist', () => {

        expect(otplib.google).to.be.an('object');
        expect(otplib.google.generate).to.be.an('function');
        expect(otplib.google.secret).to.be.an('function');
        expect(otplib.google.check).to.be.an('function');
    });


    it('[Core/HOTP] Ensure correct code generation', () => {

        for (let i in passSet){
            expect(otplib.core.hotp(passSet[i][0], passSet[i][1])).to.be.eql(passSet[i][2]);
        }

        for (let j in failSet){
            expect(otplib.core.hotp(failSet[j][0], failSet[j][1])).to.not.eql(failSet[j][2]);
        }

    });


    it('[Core/HOTP] Check Function', function(){

        for (let i in passSet){
            expect(otplib.core.checkHOTP(passSet[i][2], passSet[i][0], passSet[i][1])).to.be.eql(true);
        }

        for (let j in failSet){
            expect(otplib.core.checkHOTP(failSet[j][2], failSet[j][0], failSet[j][1])).to.be.eql(false);
        }
    });


    it('[Core/TOTP] Ensure correct code generation', () => {
        otplib.core.epoch = 59 * 1000;
        expect(otplib.core.totp('12341234123412341234')).to.be.eql('972213');
    });


    it('[Core/TOTP] Check Function', () => {
        let key = 972213;

        otplib.core.test = true;

        expect(otplib.core.checkTOTP(key, '12341234123412341234', 59 * 1000)).to.be.eql(true);
        expect(otplib.core.checkTOTP(key + 1, '12341234123412341234', 59 * 1000)).to.be.eql(false);
    });


    it('[Core/Secret] Should generate secret of specified length', () => {
        expect(otplib.core.secret.generate(-1).length).to.be.eql(0);

        expect(otplib.core.secret.generate().length).to.be.eql(16);

        expect(otplib.core.secret.generate(1).length).to.be.eql(1);
        expect(otplib.core.secret.generate(8).length).to.be.eql(8);
        expect(otplib.core.secret.generate(128).length).to.be.eql(128);
    });


    it('[GA/Secret] Should generate secret of specified length', () => {
        expect(otplib.google.secret(-1).length).to.be.eql(0);

        expect(otplib.google.secret().length).to.be.eql(16);

        expect(otplib.google.secret(1).length).to.be.eql(1);
        expect(otplib.google.secret(8).length).to.be.eql(8);
        expect(otplib.google.secret(128).length).to.be.eql(128);
    });


    it('[GA/encode-decode] Should check encoding and decoding correctness', () => {
        let s = otplib.google.secret();

        let e = otplib.google.encode(s);
        let d = otplib.google.decode(e);

        expect(s).to.be.eql(d);
    });


    it('[GA/OTP] Ensure correct token length', () => {

        // Secret length between 10 and 50
        function rlen() {
            return (Math.random() * 39 + 10).toString(10).slice(0, 2);
        }

        for (let i = 0; i < 6; i++) {
            let s = otplib.google.secret(rlen());
            let t = otplib.google.generate(s);
            expect(t.length).to.be.eql(6);
        }

    });


});


