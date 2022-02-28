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

// remove ts-loader as .ts files already loaded by Angular linker
config.module!.rules = config.module!.rules!.filter(
  // todo: (el: RuleSetRule)
  (el: any) => el.loader !== 'ts-loader'
);

// if ts-loader used, change tsconfig.json for this project to use the project's paths
let tsLoader = config.module!.rules!.find(
  // todo: (el: RuleSetRule)
  (el: any) => el.loader === 'ts-loader'
) as { [key: string]: any };

if (tsLoader) {
  tsLoader.options!.configFile = resolve(__dirname, './tsconfig.json');
}

export default config;
