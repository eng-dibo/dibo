import { resolve } from 'path';
import jestConfig from '@engineers/ngx-utils/jest.config';
import { getPaths } from '~~jest.config';

// don't mutate the original jestConfig as it may be used by another projects at the same time
let config = Object.assign({}, jestConfig, {
  // rootDir must be set to the nearest tsconfig path,
  // so moduleNameMapper could resolve tsconfig.paths correctly
  // if rootDir set to the workspace's root (i.e ../..), use `testMatch`,
  // otherwise each test file runs multiple time
  rootDir: __dirname,
  // add aliases from the current tsconfig
  moduleNameMapper: getPaths(resolve(__dirname, './tsconfig.json')),
  // jest setups for each testing file,
  // for example: preparing the testing environment
});

export default config;
