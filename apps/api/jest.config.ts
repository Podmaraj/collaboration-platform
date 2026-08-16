import type { Config } from 'jest';

const config: Config = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: ['**/*.(t|j)s'],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@collab/types$': '<rootDir>/../../packages/types/src',
    '^@collab/config$': '<rootDir>/../../packages/config/src',
    '^@collab/validation$': '<rootDir>/../../packages/validation/src',
  },
};

export default config;
