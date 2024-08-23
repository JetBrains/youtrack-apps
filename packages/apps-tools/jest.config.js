/** @type {import('ts-jest').JestConfigWithTsJest} **/
module.exports = {
  testEnvironment: 'node',
  verbose: true,
  testMatch: ['**/?(*.)+(spec|test).ts'],
  transform: {
    '^.+.ts?$': ['ts-jest', {}],
  },
};
