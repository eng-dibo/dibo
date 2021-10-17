import { resolve } from 'path';
import baseConfig from '../webpack.config';
import { deepMerge } from '@engineers/javascript/merge';
import { Configuration, RuleSetRule } from 'webpack';

let config: Configuration = deepMerge([
  baseConfig,
  {
    entry: {
      // use angular.server.options.main
      // express: resolve(__dirname, './express.ts'),
    },
    output: {
      path: resolve(__dirname, '../../../dist/ngx-cms/core/server'),
      // todo: use the original filename, i.e: express not main
      filename: '[name].js',
    },
  },
]);

// use tsconfig.json for server
(
  config.module!.rules!.find(
    // todo: (el: RuleSetRule)
    (el: any) => el.loader === 'ts-loader'
  ) as { [key: string]: any }
).options!.configFile = resolve(__dirname, './tsconfig.json');

// todo: a temporary workaround to fix: `Unexpected token 'export'` caused by `_asyncToGenerator(fn)`
// this error occurs when express.ts or any of its dependencies has an async function definition
// and configs merged by `@angular-builders/custom-webpack:server`
// exporting a function prevents custom-webpack from merging configs using asyncToGenerator from babel
function configFn(originalConfig: any): any {
  return deepMerge([originalConfig, config]);
}

// export default config;
export default configFn;
