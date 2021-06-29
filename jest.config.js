// https://jestjs.io/docs/cli

module.exports = {
  // use ts-jest to compile test files written in typescript
  // alternatively, run `tsc` to compile .ts files first.
  preset: "ts-jest",
  testEnvironment: "node",
  // don't inject jest methods (test,describe,...) to the global scope
  // you must import them from '@jest/globals
  injectGlobals: false,
  // run tests for only files that changed from the last commit
  onlyChanged: true,
  // output the coverage report (--coverage in cli)
  collectCoverage: false,
};
