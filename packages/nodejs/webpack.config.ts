import { resolve } from 'node:path';
import baseConfig from '~~webpack.config';
import { Configuration } from 'webpack';
import webpackMerge from 'webpack-merge';

import { getEntries, read } from '@engineers/nodejs/fs-sync';

let tsConfig = read(resolve(__dirname, 'tsconfig.json')) as {
  [key: string]: any;
};
let entry: { [key: string]: string } = {};
// convert path to posix, i.e using "/" in all platforms
let pattern = new RegExp(`${__dirname.replace(/\\/g, '/')}/(.+).ts$`);
for (let file of getEntries(__dirname, /(?<!.config|.spec).ts$/)) {
  entry[file.replace(/\\/g, '/').match(pattern)![1]] = file;
}

export default webpackMerge(baseConfig, {
  entry,
  output: {
    path: resolve(__dirname, tsConfig.compilerOptions.outDir),
  },
});
