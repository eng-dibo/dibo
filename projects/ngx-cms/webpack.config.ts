import { resolve } from 'path';
import baseConfig from '~~webpack.config';
import { deepMerge } from '@engineers/javascript/merge';
import { Configuration, RuleSetRule } from 'webpack';
import externals from '@engineers/webpack/externals';

let projectConfig: Configuration = {
  resolve: {
    alias: {
      '~': resolve(__dirname, '.'),
    },
  },
};
let config: Configuration = deepMerge([baseConfig, projectConfig]);

// use tsconfig.json for this project to use the project's paths
(
  config.module!.rules!.find(
    // todo: (el: RuleSetRule)
    (el: any) => el.loader === 'ts-loader'
  ) as { [key: string]: any }
).options!.configFile = resolve(__dirname, './tsconfig.json');

// add @engineers/*, ~*, ~~* to externals
(config.externals as Array<any>).unshift(
  // externals([/@engineers\/.+/],'commonjs2 ../../../../packages/{{request}}'),
  function () {
    externals(
      arguments,
      [/^~{1,2}config\/(.*)/],
      'commonjs2 ../../config/{{$1}}'
    );
  }
);

export default config;
