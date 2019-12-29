// export const table: {
//   epoch: number;
//   secret: string;
//   token: string;
// }[] = [
//   {
//     epoch: 1565103854545,
//     secret: 'NBCC6NZLM5DU4L2HMF3HS4DPNYYHK32R',
//     token: '566155'
//   },
//   {
//     epoch: 1565103903110,
//     secret: 'MNWGYTSQMR4UG3ZRJ5VUQUTCGFTVMT3W',
//     token: '540849'
//   },
//   {
//     epoch: 1565106003151,
//     secret: 'IM4G6QTIONHS63SRKRBEU4LEIRSTIQTM',
//     token: '668733'
//   },
//   {
//     epoch: 1565106018408,
//     secret: 'PIZGURTBIZ2EU4SNGFKHE5LXKVEFA6CM',
//     token: '767234'
//   },
//   {
//     epoch: 1565106407848,
//     secret: 'LA2XU3LZO53SWWJVKFVFU3TGIQZEU3SF',
//     token: '942732'
//   },
//   {
//     epoch: 1565106431089,
//     secret: 'PE4U4RBVMJFE6V2VOBEGINLKMJ3G4LZZ',
//     token: '235413'
//   },
//   {
//     epoch: 1565106483557,
//     secret: 'I5JUGURXO5TTGVRUGBBUGU2TNZMVSVTP',
//     token: '508543'
//   }
// ];

export const deltaTable = {
  secret: 'J44DMWLUIFHE63SQKR4FKODQKB2UWZCT',
  epoch: 1565973031233,
  rows: [
    ['039223', -2],
    ['311336', -1],
    ['288367', 0],
    ['408608', 1],
    ['721767', 2],
    ['819412', null]
  ] as [string, number | null][]
};

export const table: {
  decoded: string;
  digest: string;
  secret: string;
  epoch: number;
  token: string;
}[] = [
  {
    decoded: '68442f372b67474e2f47617679706f6e30756f51',
    digest: '422eb1a849cf0650fef4dbdd8b0ee0fe57a87eb9',
    epoch: 1565103854545,
    secret: 'NBCC6NZLM5DU4L2HMF3HS4DPNYYHK32R',
    token: '566155'
  },
  {
    decoded: '68442f372b67474e2f47617679706f6e30756f51',
    digest: 'c305b82dbf2a8d2d8a22e9d3992e4e666222d0e2',
    secret: 'NBCC6NZLM5DU4L2HMF3HS4DPNYYHK32R',
    epoch: 1565103878581,
    token: '522154'
  },
  {
    decoded: '636c6c4e506479436f314f6b4852623167564f76',
    digest: '64a959e511420af1a406424f87b4412977b3cbd4',
    secret: 'MNWGYTSQMR4UG3ZRJ5VUQUTCGFTVMT3W',
    epoch: 1565103903110,
    token: '540849'
  }
];
