import {expect} from 'chai';
import data from '../helpers/data';

describe('Legacy (2.x.x adapter)', function(){

    let otplib;

    beforeEach(() => {
        otplib = require('../../src/v2');
    });


    afterEach(() => {
        otplib = '';
    });


    it('[Core] ensure entry methods exist', () => {

        expect(otplib).to.be.an('object');
        expect(otplib.core).to.be.an('object');

        expect(otplib.core.totp).to.be.an('function');
        expect(otplib.core.hotp).to.be.an('function');

        expect(otplib.core.checkTOTP).to.be.an('function');
        expect(otplib.core.checkHOTP).to.be.an('function');
    });


    it('[GA] ensure entry methods exist', () => {

        expect(otplib.google).to.be.an('object');
        expect(otplib.google.generate).to.be.an('function');
        expect(otplib.google.secret).to.be.an('function');
        expect(otplib.google.check).to.be.an('function');
    });


    it('[Core/HOTP] ensure correct code generation', () => {

        data.passes.forEach((entry) => {
            expect(otplib.core.hotp(
                entry[0],
                entry[1])
            ).to.be.eql(entry[2]);
        });

        data.fails.forEach((entry) => {
            expect(otplib.core.hotp(
                entry[0],
                entry[1])
            ).to.not.eql(entry[2]);
        });

    });


    it('[Core/HOTP] method `check`', function(){


        data.passes.forEach((entry) => {
            expect(otplib.core.checkHOTP(
                entry[2],
                entry[0],
                entry[1])
            ).to.be.eql(true);
        });

        data.fails.forEach((entry) => {
            expect(otplib.core.checkHOTP(
                entry[2],
                entry[0],
                entry[1])
            ).to.be.eql(false);
        });
    });


    it('[Core/TOTP] ensure correct code generation', () => {
        otplib.core.epoch = 59 * 1000;
        expect(otplib.core.totp('12341234123412341234')).to.be.eql('972213');
    });


    it('[Core/TOTP] method `check`', () => {
        let key = 972213;

        otplib.core.test = true;

        expect(otplib.core.checkTOTP(
            key,
            '12341234123412341234',
            59 * 1000)
        ).to.be.eql(true);

        expect(otplib.core.checkTOTP(
            key + 1,
            '12341234123412341234',
            59 * 1000)
        ).to.be.eql(false);
    });


    it('[Core/Secret] should generate secret of specified length', () => {
        expect(otplib.core.secret.generate(-1).length).to.be.eql(0);

        expect(otplib.core.secret.generate().length).to.be.eql(16);

        expect(otplib.core.secret.generate(1).length).to.be.eql(1);
        expect(otplib.core.secret.generate(8).length).to.be.eql(8);
        expect(otplib.core.secret.generate(128).length).to.be.eql(128);
    });


    it('[GA/Secret] should generate secret of specified length', () => {
        expect(otplib.google.secret(-1).length).to.be.eql(0);

        expect(otplib.google.secret().length).to.be.eql(16);

        expect(otplib.google.secret(1).length).to.be.eql(1);
        expect(otplib.google.secret(8).length).to.be.eql(8);
        expect(otplib.google.secret(128).length).to.be.eql(128);
    });


    it('[GA/encode-decode] should check encoding and decoding correctness', () => {
        let s = otplib.google.secret();

        let e = otplib.google.encode(s);
        let d = otplib.google.decode(e);

        expect(s).to.be.eql(d);
    });


    it('[GA/OTP] ensure correct token length', () => {

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


