import totpToken from './totpToken';

describe('totpToken', () => {
  const secret = 'i6im0gc96j0mn00c';
  const noEpoch = 'Expecting options.epoch to be a number';
  const noStep = 'Expecting options.step to be a number';

  it('should throw an error when option is undefined', () => {
    expect(() => totpToken(secret, void 0)).toThrow(Error);
  });

  it('should throw an error when option is null', () => {
    expect(() => totpToken(secret, null)).toThrow(Error);
  });

  it('should throw an error when options.epoch is undefined', () => {
    expect(() => totpToken(secret, {})).toThrow(noEpoch);
  });

  it('should throw an error when options.step is undefined', () => {
    expect(() => totpToken(secret, { epoch: 0 })).toThrow(noStep);
  });
});
