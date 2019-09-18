module.exports = {
  collectCoverageFrom: [
    'packages/**/*.{js,ts}',
    '!**/node_modules/**',
    '!packages/tests-*/*',
    '!packages/otplib-preset-browser/**',
    '!packages/pkg-*/*'
  ],
  coverageDirectory: './coverage/',
  modulePaths: ['<rootDir>/packages/'],
  modulePathIgnorePatterns: ['<rootDir>/.*/__mocks__'],
  roots: ['<rootDir>/packages/'],
  resetMocks: true,
  setupFiles: [],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/packages/tests-data/',
    '/packages/tests-suites/',
    '/packages/pkg-extras/'
  ],
  testURL: 'http://localhost',
  transform: {
    '^.+\\.(js|ts)$': [
      'babel-jest',
      {
        rootMode: 'upward'
      }
    ]
  }
};
