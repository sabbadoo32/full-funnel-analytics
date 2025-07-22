module.exports = {
  testEnvironment: 'node',
  moduleDirectories: ['node_modules'],
  testMatch: ['**/tests/**/*.test.js'],
  setupFiles: ['<rootDir>/tests/setup.js'],
  verbose: true,
  moduleFileExtensions: ['js', 'json'],
  testPathIgnorePatterns: ['/node_modules/'],
  transform: {},
  roots: ['<rootDir>']
};
