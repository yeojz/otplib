module.exports = {
  collectCoverageFrom: [
    'packages/**/*.{js,ts}',
    '!**/node_modules/**',
    '!packages/otplib-preset-browser/**',
    '!**/build/*',
    '!**/external/*',
    '!**/test/*'
  ],
  coverageDirectory: './coverage/',
  modulePathIgnorePatterns: ['<rootDir>/.*/__mocks__'],
  resetMocks: true,
  setupFiles: [],
  testPathIgnorePatterns: ['/node_modules/'],
  testURL: 'http://localhost',
  moduleNameMapper: {
    '@otplib/(.*)$': '<rootDir>/packages/otplib-$1',
    'tests/(.*)$': '<rootDir>/tests/$1'
  },
  transform: {
    '^.+\\.(js|ts)$': [
      'babel-jest',
      {
        rootMode: 'upward'
      }
    ]
  }
};
