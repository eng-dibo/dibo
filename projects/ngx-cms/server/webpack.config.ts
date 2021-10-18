import { resolve } from 'path';
import baseConfig from '../webpack.config';
import { Configuration } from 'webpack';
import webpackMerge from 'webpack-merge';

// merge with 'webpackMerge' so arrays are merged
let config: Configuration = webpackMerge(baseConfig, {
  entry: {
    // use angular.server.options.main
    // express: resolve(__dirname, './express.ts'),
  },
  output: {
    path: resolve(__dirname, '../../../dist/ngx-cms/core/server'),
    // todo: use the original filename, i.e: express not main
    filename: '[name].js',
  },
});

// use tsconfig.json for server
(
  config.module!.rules!.find(
    // todo: (el: RuleSetRule)
    (el: any) => el.loader === 'ts-loader'
  ) as { [key: string]: any }
).options!.configFile = resolve(__dirname, './tsconfig.json');

export default config;
