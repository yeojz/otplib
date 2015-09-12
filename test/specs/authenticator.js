import {expect} from 'chai';

import Authenticator from '../../src/classes/Authenticator';
import data from '../helpers/data';

describe('Authenticator', function(){

    let otp;

    beforeEach(() => {
        otp = new Authenticator();
    });

    it('check existence of methods', () => {

        let methods = [
            'options',
            'generate',
            'check',
            'keyuri',
            'qrcode',
            'encode',
            'decode',
            'generateSecret'
        ];

        methods.forEach((key) => {
            try {
                expect(otp[key]).to.be.an('function');
            } catch(err){
                throw new Error(err + ' (method: ' + key + ')');
            }
        });
    });


    it('[method/generateSecret] length of key', () => {
        expect(otp.generateSecret().length).to.be.equal(16);
        expect(otp.generateSecret(20).length).to.be.equal(20);
    });


    it('[method/keyuri] generate expect keyuri', () => {
        let url = otp.keyuri('me', 'test', '123');
        expect(url).to.be.equal(encodeURIComponent('otpauth://totp/test:me?secret=123&issuer=test'));
    });


    it('[method/qrcode] generate expect keyuri', () => {
        otp.options({
            chart: 'http://testing.local?type=%uri'
        });

        let url = otp.qrcode();

        expect(url).to.be.equal('http://testing.local?type='
            + encodeURIComponent('otpauth://totp/service:user?secret=&issuer=service'));
    });


    it('[method/encode] check for correct encoding', () => {
        data.endec.forEach((entry) => {
            expect(otp.encode(entry[0])).to.be.equal(entry[1]);
        });
    });


    it('[method/decode] check for correct decoding', () => {
        data.endec.forEach((entry) => {
            expect(otp.decode(entry[1])).to.be.equal(entry[0]);
        });
    });

});
