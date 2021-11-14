// see server/webpack.config.ts

import { resolve } from 'path';
import baseConfig from '../webpack.config';
import { Configuration } from 'webpack';
import webpackMerge from 'webpack-merge';

let config: Configuration = webpackMerge(baseConfig, {
  output: {
    path: resolve(__dirname, '../../../dist/ngx-cms/core/browser'),
    filename: '[name].js',
  },
});

(
  config.module!.rules!.find((el: any) => el.loader === 'ts-loader') as {
    [key: string]: any;
  }
).options!.configFile = resolve(__dirname, './tsconfig.json');

export default config;
