import baseConfig from '../webpack.config';
import { deepMerge } from '@engineers/javascript/merge';
import { readdirSync } from 'fs';
import { resolve } from 'path';
import { Configuration } from 'webpack';

let entries: { [key: string]: string } = {};

// add all *.ts files in this directory.
readdirSync(resolve(__dirname))
  .filter((el) => el !== 'webpack.config.ts' && el.endsWith('.ts'))
  .forEach((el) => {
    entries[el.replace('.ts', '')] = resolve(__dirname, el);
  });

let config: Configuration = deepMerge([
  baseConfig,
  {
    entry: entries,
    output: {
      path: resolve(__dirname, '../../../dist/ngx-cms/config'),
    },
  },
]);

(
  config.module!.rules!.find(
    // todo: (el: RuleSetRule)
    (el: any) => el.loader === 'ts-loader'
  ) as { [key: string]: any }
).options!.configFile = resolve(__dirname, './tsconfig.json');

export default config;
