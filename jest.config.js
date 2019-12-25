module.exports = {
  collectCoverageFrom: [
    'packages/**/*.{js,ts}',
    '!**/node_modules/**',
    '!packages/otplib-preset-browser/**',
    '!build/*',
    '!external/*',
    '!tests/*'
  ],
  coverageDirectory: './coverage/',
  modulePaths: ['<rootDir>/packages/'],
  modulePathIgnorePatterns: ['<rootDir>/.*/__mocks__'],
  roots: ['<rootDir>/packages/'],
  resetMocks: true,
  setupFiles: [],
  testPathIgnorePatterns: ['/node_modules/'],
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
