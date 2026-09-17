// Force the test environment regardless of the caller's shell. Jest otherwise honours an
// explicitly set NODE_ENV, and NODE_ENV=production makes React resolve to its production build,
// which fails every suite with "act(...) is not supported in production builds of React".
process.env.NODE_ENV = 'test';

module.exports = {
  testEnvironment: 'jsdom',
  testMatch: ['**/__tests__/**/*.test.[jt]s?(x)', '**/?(*.)+(spec|test).[jt]s?(x)'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  modulePathIgnorePatterns: ['<rootDir>/.next/', '<rootDir>/.open-next/'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^react$': '<rootDir>/node_modules/react',
  },
  transform: {
    '^.+\\.(ts|tsx|js|jsx)$': ['ts-jest', {
      tsconfig: {
        jsx: 'react-jsx',
        esModuleInterop: true,
      },
      useESM: false,
    }],
  },
  transformIgnorePatterns: ['/node_modules/'],
};