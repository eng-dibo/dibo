// https://jestjs.io/docs/cli

let { pathsToModuleNameMapper } = require("ts-jest/utils");

const fs = require("fs");
// todo: use `import { read } from "@engineers/nodejs/fs-sync.read()"`
function readJson(path) {
  let data = fs.readFileSync(path).toString();
  // strip comments from json file
  data = data.replace(/(\/\/|#).*|\/\*(.|\n)*\*\//g, "");
  return JSON.parse(data);
}

let tsConfig = readJson("./tsconfig.json");
let { compilerOptions } = tsConfig;

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
  moduleDirectories: ["node_modules", "types"],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  transform: {
    "^.+\\.(t|j)sx?$": "ts-jest",
  },
  /* todo:
   pathsToModuleNameMapper generates moduleNameMapper from tsconfig.compilerOptions.paths
   https://huafu.github.io/ts-jest/user/config/#paths-mapping
   todo: fix: Could not locate module source-map-support
   https://github.com/kulshekhar/ts-jest/issues/1968#issuecomment-871522777
   fix by mapping to `<rootDir>/packages/$1`,
   but pathsToModuleNameMapper is mapping to `<rootDir>/./packages/$1`
   https://github.com/kulshekhar/ts-jest/issues/2709
   const moduleNameMapper = require("tsconfig-paths-jest")(tsConfig); didn't help

  moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, {
    prefix: "<rootDir>",
  }),*/

  moduleNameMapper: {
    "~~(.*)": "<rootDir>/$1",
    "@engineers/(.*)": "<rootDir>/packages/$1",
    // this causes error: Could not locate module ./lib/source-map-generator
    // https://github.com/kulshekhar/ts-jest/issues/2718
    // "(.*)": "<rootDir>/node_modules/$1",
  },
};
