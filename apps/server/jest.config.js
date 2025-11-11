module.exports = {
    testEnvironment: 'node',
    moduleFileExtensions: ['js', 'json', 'ts'],
    testRegex: 'src/.*\\.spec\\.ts$',
    transform: {
        '^.+\\.(t|j)s$': ['@swc/jest'],
    },
    transformIgnorePatterns: [
        'node_modules/(?!(@warpath)/)',
    ],
    collectCoverageFrom: [
        'src/**/*.(t|j)s',
        '!src/**/*.spec.ts',
        '!src/**/node_modules/**',
        '!src/**/dist/**',
    ],
    coverageDirectory: 'coverage',
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
    },
};

