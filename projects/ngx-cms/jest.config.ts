// run 'ngcc' https://thymikee.github.io/jest-preset-angular/docs/guides/angular-ivy/
import 'jest-preset-angular/ngcc-jest-processor';
import { resolve } from 'path';
import jestConfig, { getPaths } from '../../jest.config';

// don't mutate the original jestConfig as it may be used by another projects at the same time
let config = Object.assign({}, jestConfig, {
  // rootDir must be set to the nearest tsconfig path,
  // so moduleNameMapper could resolve tsconfig.paths correctly
  // if rootDir set to the workspace's root (i.e ../..), use `testMatch`,
  // otherwise each test file runs multiple time
  rootDir: __dirname,
  preset: 'jest-preset-angular',
  // add aliases from the current tsconfig
  moduleNameMapper: getPaths(resolve(__dirname, './tsconfig.json')),
  // jest setups for each testing file,
  // for example: preparing the testing environment
  setupFilesAfterEnv: ['<rootDir>/jest-setup.ts'],
});

// transform non-js files with 'jest-preset-angular' to let jest understand their syntax
// so it can compile angular component's template and style files
// https://thymikee.github.io/jest-preset-angular/docs/getting-started/options/#exposed-configuration
// https://github.com/thymikee/jest-preset-angular/issues/992?notification_referrer_id=MDE4Ok5vdGlmaWNhdGlvblRocmVhZDIzMTMyODI4NTE6NTczMDg1MzE%3D#issuecomment-902427868
config.transform!['^.+\\.(ts|js|html)$'] = 'jest-preset-angular';

// delete the transformer by 'ts-jest' to prevent overriding jest-preset-angular
let ts = Object.keys(config.transform!).find(
  (key) => config.transform![key] === 'ts-jest'
) as string;
delete config.transform![ts];

export default config;
