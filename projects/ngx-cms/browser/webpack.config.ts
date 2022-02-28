// see server/webpack.config.ts

import { resolve } from 'path';
import baseConfig from '../webpack.config';
import { Configuration } from 'webpack';
import webpackMerge from 'webpack-merge';

// todo: add ~config to externals[]
// https://stackoverflow.com/questions/70354709/webpack-externals-for-browser
let config: Configuration = webpackMerge(baseConfig, {
  target: ['web', 'es5'],
  output: {
    path: resolve(__dirname, '../../../dist/ngx-cms/core/browser'),
    filename: '[name].js',
  },
});

let tsLoader = config.module!.rules!.find(
  // todo: (el: RuleSetRule)
  (el: any) => el.loader === 'ts-loader'
) as { [key: string]: any };

if (tsLoader) {
  tsLoader.options!.configFile = resolve(__dirname, './tsconfig.json');
}

export default config;
