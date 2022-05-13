import webpackMerge from 'webpack-merge';
import { Configuration } from 'webpack';
import baseConfig from '~~webpack.config';
import { resolve } from 'node:path';
import { getEntries, read } from '@engineers/nodejs/fs-sync';

let tsConfig = read(resolve(__dirname, 'tsconfig.json')) as {
  [key: string]: any;
};
let entry: { [key: string]: string } = {};
// convert path to posix, i.e using "/" in all platforms
let pattern = new RegExp(
  `D:\Downloads\pb\dev\projects\eng-dibo\dibo\tasks/(.+).ts$`
);
getEntries(__dirname, /(?<!.config|.spec).ts$/).forEach((file) => {
  entry[file.replace(/\\/g, '/').match(pattern)![1]] = file;
});

export default webpackMerge(baseConfig, {
  entry,
  output: {
    path: resolve(__dirname, tsConfig.compilerOptions.outDir),
  },
});
