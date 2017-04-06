
const passes = [
  ['i6im0gc96j0mn00c', 47412420, '196182'],
  ['65jh84eo38k32edm', 47412423, '963234'],
  ['f4515l6ob3gkganp', 47412433, '415572'],
  ['2o9989k76ij7eh9c', 47412435, '343659']
];

const fails = [
  ['9821741871231', 1078968, 'Should fail'],
  ['18748612', 982671, '18748612'],
  ['18748612', 982671, '125832']
];

const codec = [
  ['testing secret key', 'ORSXG5DJNZTSA43FMNZGK5BANNSXS==='],
  ['the quick brown fox', 'ORUGKIDROVUWG2ZAMJZG653OEBTG66A='],
  ['mvomjsunp qwerty', 'NV3G63LKON2W44BAOF3WK4TUPE======'],
  ['abcd efgh ijkl mnop qrstu', 'MFRGGZBAMVTGO2BANFVGW3BANVXG64BAOFZHG5DV']
];

const totp = [
  ['12341234123412341234', 59000, '972213']
];

export default {
  codec,
  fails,
  passes,
  totp
}
