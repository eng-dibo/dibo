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

config.module!.rules = config.module!.rules!.filter(
  (el: any) => el.loader !== 'ts-loader'
);

let tsLoader = config.module!.rules!.find(
  (el: any) => el.loader === 'ts-loader'
) as { [key: string]: any };

if (tsLoader) {
  tsLoader.options!.configFile = resolve(__dirname, './tsconfig.json');
}

delete config.target;
delete config.output!.library;
delete config.output!.libraryTarget;
export default config;
