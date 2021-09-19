// https://jestjs.io/docs/cli
import type { Config } from '@jest/types';

// run 'ngcc' https://thymikee.github.io/jest-preset-angular/docs/guides/angular-ivy/
import 'jest-preset-angular/ngcc-jest-processor';

import pathsToModuleNameMapper from 'ts-jest/utils';
import stripJsonComments from 'strip-json-comments';
import fs from 'fs';

// todo: use `import { read } from "@engineers/nodejs/fs-sync.read()"`
function readJson(path: string): any {
  let content = fs.readFileSync(path).toString();
  // strip comments from json file
  return JSON.parse(stripJsonComments(content));
}

let tsConfig = readJson('./tsconfig.json');
let { compilerOptions } = tsConfig;

let config: Config.InitialOptions = {
  // use 'ts-jest' to enable type checking while testing
  // use 'jest-preset-angular' for angular projects (built in top of ts-jest)
  // 'jest-preset-angular' requires tsconfig.spec.json file
  preset: 'jest-preset-angular',
  testEnvironment: 'node',
  // don't inject jest methods (test,describe,...) to the global scope
  // you must import them from '@jest/globals
  injectGlobals: false,
  // run tests for only files that changed from the last commit
  onlyChanged: true,
  // output the coverage report (--coverage in cli)
  collectCoverage: false,
  moduleDirectories: ['node_modules', 'types'],
  moduleFileExtensions: [
    'ts',
    'tsx',
    'js',
    'jsx',
    'json',
    'node',
    'html',
    'scss',
    'css',
  ],
  transform: {
    // transform non-js files with 'jest-preset-angular' to let jest understand their syntax
    // so it can compile angular component's template and style files
    // https://thymikee.github.io/jest-preset-angular/docs/getting-started/options/#exposed-configuration
    // https://github.com/thymikee/jest-preset-angular/issues/992?notification_referrer_id=MDE4Ok5vdGlmaWNhdGlvblRocmVhZDIzMTMyODI4NTE6NTczMDg1MzE%3D#issuecomment-902427868
    '^.+\\.(ts|js|html)$': 'jest-preset-angular',
  },
  /*
   pathsToModuleNameMapper generates moduleNameMapper from tsconfig.compilerOptions.paths
   https://huafu.github.io/ts-jest/user/config/#paths-mapping
   // fixed: pathsToModuleNameMapper is mapping to `<rootDir>/./packages/$1`
   https://github.com/kulshekhar/ts-jest/issues/2709
   */

  /* moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, {
    prefix: "<rootDir>",
  }),*/
  // todo: use pathsToModuleNameMapper
  moduleNameMapper: {
    '~~(.*)': '<rootDir>/$1',
    '@engineers/(.*)': '<rootDir>/packages/$1',
    // this causes error: Could not locate module ./lib/source-map-generator
    // https://github.com/kulshekhar/ts-jest/issues/2718
    // "(.*)": "<rootDir>/node_modules/$1",
  },

  // jest setups for each testing file,
  // for example: preparing the testing environment
  setupFilesAfterEnv: ['<rootDir>/jest-setup.ts'],

  // todo: causes error: AggregatedResult must be present after test run is complete
  // watch: true,
};
export default config;

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
