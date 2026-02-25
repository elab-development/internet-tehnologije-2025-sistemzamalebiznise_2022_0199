module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/lib', '<rootDir>/app'],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js'],
  testMatch: ['**/*.test.ts'],
};