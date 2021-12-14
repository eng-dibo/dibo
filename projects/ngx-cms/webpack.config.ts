import { resolve } from 'path';
import baseConfig from '~~webpack.config';
import webpackMerge from 'webpack-merge';
import { Configuration } from 'webpack';

let config: Configuration = webpackMerge(baseConfig, {
  resolve: {
    alias: {
      '~': resolve(__dirname, '.'),
    },
  },
  externals: [],
});

// use tsconfig.json for this project to use the project's paths
(
  config.module!.rules!.find(
    // todo: (el: RuleSetRule)
    (el: any) => el.loader === 'ts-loader'
  ) as { [key: string]: any }
).options!.configFile = resolve(__dirname, './tsconfig.json');

export default config;
