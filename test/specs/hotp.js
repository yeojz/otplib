import {expect} from 'chai';

import HOTP from '../../src/classes/HOTP';
import data from '../helpers/data';

describe('HOTP', function(){

    let otp;

    beforeEach(() => {
        otp = new HOTP();
    });

    it('check method existence', () => {

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
        for (let i in data.passes){
            expect(otp.generate(
                data.passes[i][0],
                data.passes[i][1])
            ).to.be.eql(data.passes[i][2]);
        }
    });


    it('[method/generate] incorrect codes', () => {
        for (let j in data.fails){
            expect(otp.generate(
                data.fails[j][0],
                data.fails[j][1])
            ).to.not.eql(data.fails[j][2]);
        }
    });


    it('[method/check] pass', () => {
        for (let i in data.passes){
            expect(otp.check(
                data.passes[i][2],
                data.passes[i][0],
                data.passes[i][1])
            ).to.be.eql(true);
        }
    });


    it('[method/check] fails', () => {
        for (let j in data.fails){
            expect(otp.check(
                data.fails[j][2],
                data.fails[j][0],
                data.fails[j][1])
            ).to.be.eql(false);
        }
    });







});
