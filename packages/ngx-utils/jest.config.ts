import jestConfig from '../../jest.config';

let config = Object.assign({}, jestConfig, {
  preset: 'jest-preset-angular',
  testMatch: [`${__dirname}/**/*.spec.ts`],
  setupFilesAfterEnv: [`${__dirname}/jest-setup.ts`],
  // run 'ngcc' https://thymikee.github.io/jest-preset-angular/docs/guides/angular-ivy/
  // replaces the deprecated: `import 'jest-preset-angular/ngcc-jest-processor'`;
  globalSetup: 'jest-preset-angular/global-setup',
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
