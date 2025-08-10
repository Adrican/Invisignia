module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  testTimeout: 60000, // Aumentar a 60 segundos
  setupFilesAfterEnv: ['<rootDir>/tests/config/selenium.config.js'],
  verbose: true,
  maxWorkers: 1, // Ejecutar tests secuencialmente para evitar conflictos
};