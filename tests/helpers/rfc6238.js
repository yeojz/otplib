/*
Source: https://tools.ietf.org/html/rfc6238

RFC 6238                      HOTPepochBased                     May 2011


   The test token shared secret uses the ASCII string value
   "12345678901234567890".  With epoch Step X = 30, and the Unix epoch as
   the initial value to count epoch steps, where T0 = 0, the TOTP
   algorithm will display the following values for specified modes and
   epochstamps.

  +-------------+--------------+------------------+----------+--------+
  |  epoch (sec) |   UTC epoch   | Value of T (hex) |   TOTP   |  Mode  |
  +-------------+--------------+------------------+----------+--------+
  |      59     |  1970-01-01  | 0000000000000001 | 94287082 |  SHA1  |
  |             |   00:00:59   |                  |          |        |
  |      59     |  1970-01-01  | 0000000000000001 | 46119246 | SHA256 |
  |             |   00:00:59   |                  |          |        |
  |      59     |  1970-01-01  | 0000000000000001 | 90693936 | SHA512 |
  |             |   00:00:59   |                  |          |        |
  |  1111111109 |  2005-03-18  | 00000000023523EC | 07081804 |  SHA1  |
  |             |   01:58:29   |                  |          |        |
  |  1111111109 |  2005-03-18  | 00000000023523EC | 68084774 | SHA256 |
  |             |   01:58:29   |                  |          |        |
  |  1111111109 |  2005-03-18  | 00000000023523EC | 25091201 | SHA512 |
  |             |   01:58:29   |                  |          |        |
  |  1111111111 |  2005-03-18  | 00000000023523ED | 14050471 |  SHA1  |
  |             |   01:58:31   |                  |          |        |
  |  1111111111 |  2005-03-18  | 00000000023523ED | 67062674 | SHA256 |
  |             |   01:58:31   |                  |          |        |
  |  1111111111 |  2005-03-18  | 00000000023523ED | 99943326 | SHA512 |
  |             |   01:58:31   |                  |          |        |
  |  1234567890 |  2009-02-13  | 000000000273EF07 | 89005924 |  SHA1  |
  |             |   23:31:30   |                  |          |        |
  |  1234567890 |  2009-02-13  | 000000000273EF07 | 91819424 | SHA256 |
  |             |   23:31:30   |                  |          |        |
  |  1234567890 |  2009-02-13  | 000000000273EF07 | 93441116 | SHA512 |
  |             |   23:31:30   |                  |          |        |
  |  2000000000 |  2033-05-18  | 0000000003F940AA | 69279037 |  SHA1  |
  |             |   03:33:20   |                  |          |        |
  |  2000000000 |  2033-05-18  | 0000000003F940AA | 90698825 | SHA256 |
  |             |   03:33:20   |                  |          |        |
  |  2000000000 |  2033-05-18  | 0000000003F940AA | 38618901 | SHA512 |
  |             |   03:33:20   |                  |          |        |
  | 20000000000 |  2603-10-11  | 0000000027BC86AA | 65353130 |  SHA1  |
  |             |   11:33:20   |                  |          |        |
  | 20000000000 |  2603-10-11  | 0000000027BC86AA | 77737706 | SHA256 |
  |             |   11:33:20   |                  |          |        |
  | 20000000000 |  2603-10-11  | 0000000027BC86AA | 47863826 | SHA512 |
  |             |   11:33:20   |                  |          |        |
  +-------------+--------------+------------------+----------+--------+

                            Table 1: TOTP Table



M'Raihi, et al.               Informational                    [Page 15]
*/

const table = [
  {
    epoch: 59,
    counter: '0000000000000001',
    token: '94287082',
    algorithm: 'SHA1'
  },
  {
    epoch: 59,
    counter: '0000000000000001',
    token: '46119246',
    algorithm: 'SHA256'
  },
  {
    epoch: 59,
    counter: '0000000000000001',
    token: '90693936',
    algorithm: 'SHA512'
  },
  {
    epoch: 1111111109,
    counter: '00000000023523EC',
    token: '07081804',
    algorithm: 'SHA1'
  },
  {
    epoch: 1111111109,
    counter: '00000000023523EC',
    token: '68084774',
    algorithm: 'SHA256'
  },
  {
    epoch: 1111111109,
    counter: '00000000023523EC',
    token: '25091201',
    algorithm: 'SHA512'
  },
  {
    epoch: 1111111111,
    counter: '00000000023523ED',
    token: '14050471',
    algorithm: 'SHA1'
  },
  {
    epoch: 1111111111,
    counter: '00000000023523ED',
    token: '67062674',
    algorithm: 'SHA256'
  },
  {
    epoch: 1111111111,
    counter: '00000000023523ED',
    token: '99943326',
    algorithm: 'SHA512'
  },
  {
    epoch: 1234567890,
    counter: '000000000273EF07',
    token: '89005924',
    algorithm: 'SHA1'
  },
  {
    epoch: 1234567890,
    counter: '000000000273EF07',
    token: '91819424',
    algorithm: 'SHA256'
  },
  {
    epoch: 1234567890,
    counter: '000000000273EF07',
    token: '93441116',
    algorithm: 'SHA512'
  },
  {
    epoch: 2000000000,
    counter: '0000000003F940AA',
    token: '69279037',
    algorithm: 'SHA1'
  },
  {
    epoch: 2000000000,
    counter: '0000000003F940AA',
    token: '90698825',
    algorithm: 'SHA256'
  },
  {
    epoch: 2000000000,
    counter: '0000000003F940AA',
    token: '38618901',
    algorithm: 'SHA512'
  },
  {
    epoch: 20000000000,
    counter: '0000000027BC86AA',
    token: '65353130',
    algorithm: 'SHA1'
  },
  {
    epoch: 20000000000,
    counter: '0000000027BC86AA',
    token: '77737706',
    algorithm: 'SHA256'
  },
  {
    epoch: 20000000000,
    counter: '0000000027BC86AA',
    token: '47863826',
    algorithm: 'SHA512'
  }
];

export default {
  table,
  secret: '12345678901234567890',
  step: 30
}
