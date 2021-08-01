// https://jestjs.io/docs/cli

// run 'ngcc' https://thymikee.github.io/jest-preset-angular/docs/guides/angular-ivy/
require("jest-preset-angular/ngcc-jest-processor");

let { pathsToModuleNameMapper } = require("ts-jest/utils");
let stripJsonComments = require("strip-json-comments");

const fs = require("fs");
// todo: use `import { read } from "@engineers/nodejs/fs-sync.read()"`
function readJson(path) {
  let content = fs.readFileSync(path).toString();
  // strip comments from json file
  return JSON.parse(stripJsonComments(content));
}

let tsConfig = readJson("./tsconfig.json");
let { compilerOptions } = tsConfig;

module.exports = {
  // use 'ts-jest' to enable type checking while testing
  // use 'jest-preset-angular' for angular projects (built in top of ts-jest)
  // 'jest-preset-angular' requires tsconfig.spec.json file
  preset: "jest-preset-angular",
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

  // jest setups for each testing file,
  // for example: preparing the testing environment
  setupFilesAfterEnv: ["<rootDir>/jest-setup.ts"],

  // todo: causes error: AggregatedResult must be present after test run is complete
  // watch: true,
};

/*
 // to change 'ts-jest' options

  // get the default ts-jest options of 'jest-preset-angular' to override them
 const tsJestPreset = require('jest-preset-angular/jest-preset').globals['ts-jest'];
 {
   globals:{
    'ts-jest': {
      // default options
      ...tsJestPreset,
      // your options
      tsConfig: 'tsconfig.spec.json'
    }
  }
}
 }

*/
