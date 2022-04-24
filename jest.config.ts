// https://jestjs.io/docs/cli
import type { Config } from '@jest/types';
import { pathsToModuleNameMapper } from 'ts-jest';
import stripJsonComments from 'strip-json-comments';
import fs from 'fs';

export function getPaths(
  tsConfigPath = './tsconfig.json',
  prefix = '<rootDir>'
) {
  // todo: use `import { read } from "@engineers/nodejs/fs-sync.read()"`
  function readJson(path: string): any {
    let content = fs.readFileSync(path).toString();
    // strip comments from json file
    return JSON.parse(stripJsonComments(content));
  }

  let tsConfig = readJson(tsConfigPath);
  /*
   pathsToModuleNameMapper generates moduleNameMapper from tsconfig.compilerOptions.paths
   https://huafu.github.io/ts-jest/user/config/#paths-mapping
   // fixed: pathsToModuleNameMapper is mapping to `<rootDir>/./packages/$1`
   https://github.com/kulshekhar/ts-jest/issues/2709
   // todo: add '~' to every project or package jest.config
   */

  return pathsToModuleNameMapper(tsConfig.compilerOptions.paths, {
    prefix,
  });
}

let config: Config.InitialOptions = {
  rootDir: __dirname,
  // use 'ts-jest' to enable type checking while testing
  // use 'jest-preset-angular' for angular projects (built in top of ts-jest)
  // 'jest-preset-angular' requires tsconfig.spec.json file
  preset: 'ts-jest',
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
    'html',
    'scss',
    'css',
    'node',
  ],
  transform: {
    '^.+\\.(t|j)sx?$': 'ts-jest',
  },
  moduleNameMapper: getPaths(),

  // todo: causes error: AggregatedResult must be present after test run is complete
  // watch: true,
  projects: [
    '<rootDir>/packages/**/jest.config.ts',
    '<rootDir>/projects/**/jest.config.ts',
  ],
  /*
  ignore files inside 'dist' dirs to solve the error:
  `The name `@engineers/*` was looked up in the Haste module map. 
   It cannot be resolved, because there exists several different files, or packages`
   this error occurs when ./dist/package.json has the same name as ./package.json
  */
  modulePathIgnorePatterns: ['dist', 'test!!'],
  // todo: exclude /dist
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
