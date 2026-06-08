/** @type {import('jest').Config} */
module.exports = {
  preset: "jest-puppeteer",
  transform: {
    "^.+\\.js$": "babel-jest",
  },
  testMatch: ["**/tests/e2e/**/*.test.js"],
  testTimeout: 30000,
};
