import {expect} from 'chai';

import HOTP from '../../src/classes/HOTP';
import data from '../helpers/data';

describe('HOTP', function(){

    let otp;

    beforeEach(() => {
        otp = new HOTP();
    });

    it('check existence of methods', () => {

        let methods = [
            'options',
            'generate',
            'check'
        ];


        methods.forEach((key) => {
            try {
                expect(otp[key]).to.be.an('function');
            } catch(err){
                throw new Error(err + ' (method: ' + key + ')');
            }
        });
    });


    it('[method/generate] correct codes', () => {
        data.passes.forEach((entry) => {
            expect(otp.generate(
                entry[0],
                entry[1])
            ).to.be.eql(entry[2]);
        });
    });


    it('[method/generate] incorrect codes', () => {
        data.fails.forEach((entry) => {
            expect(otp.generate(
                entry[0],
                entry[1])
            ).to.not.eql(entry[2]);
        });
    });


    it('[method/check] pass', () => {
        data.passes.forEach((entry) => {
            expect(otp.check(
                entry[2],
                entry[0],
                entry[1])
            ).to.be.eql(true);
        });
    });


    it('[method/check] fails', () => {
        data.fails.forEach((entry) => {
            expect(otp.check(
                entry[2],
                entry[0],
                entry[1])
            ).to.be.eql(false);
        });
    });

});
