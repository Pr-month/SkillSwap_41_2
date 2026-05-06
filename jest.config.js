module.exports = {
  rootDir: '.',
  moduleFileExtensions: ['js', 'json', 'ts'],
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  coverageDirectory: './coverage',
  testEnvironment: 'node',

  // Превращает импорт 'src/...' в реальный путь ' <rootDir>/src/...'
  moduleNameMapper: {
    '^src/(.*)$': '<rootDir>/src/$1',
  },
};