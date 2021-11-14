import baseConfig from '../webpack.config';
import { deepMerge } from '@engineers/javascript/merge';
import { readdirSync } from 'fs';
import { resolve } from 'path';
import { Configuration } from 'webpack';

let entries: { [key: string]: string } = {};

// add all *.ts files in this directory.
// todo: files moved to subdirectories /server, browser
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
    // add config files to externals to prevent bundling them
    // i.e: server should require('./database') instead of including its code while compiling
    // each entry point must find its dependencies in the dist folder,
    // i.e: when compiling ./server.ts, dist/database.js must be exists
    // externals: Object.values(entries),
    externals: [
      (params: any, cb: any) => {
        if (
          // only config files
          params.context === resolve(__dirname) &&
          params.request.startsWith('./')
        ) {
          // console.log({ params });
          cb(null, `commonjs2 ${params.request}`);
        } else {
          cb();
        }
      },
    ],
  },
]);

(
  config.module!.rules!.find(
    // todo: (el: RuleSetRule)
    (el: any) => el.loader === 'ts-loader'
  ) as { [key: string]: any }
).options!.configFile = resolve(__dirname, './tsconfig.json');

export default config;
