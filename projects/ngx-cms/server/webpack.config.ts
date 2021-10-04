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

export default config;
