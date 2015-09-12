import {expect} from 'chai';

import TOTP from '../../src/classes/TOTP';
import data from '../helpers/data';

describe('TOTP', function(){

    let otp;

    beforeEach(() => {
        otp = new TOTP();
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
        otp.options({
            epoch: 59 * 1000
        });

        expect(otp.generate('12341234123412341234')).to.be.equal('972213')
    });


});
