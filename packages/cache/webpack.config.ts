import webpackMerge from 'webpack-merge';
import baseConfig from '~~webpack.config';
import { getEntries, read } from '@engineers/nodejs/fs-sync';
import { resolve } from 'node:path';

let tsConfig = read(resolve(__dirname, 'tsconfig.json')) as {
  [key: string]: any;
};
let entry: { [key: string]: string } = {};
// convert path to posix, i.e using "/" in all platforms
// eslint-disable-next-line security-node/non-literal-reg-expr
let pattern = new RegExp(`${__dirname.replace(/\\/g, '/')}/(.+).ts$`);
for (let file of getEntries(__dirname, /(?<!.config|.spec).ts$/)) {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  entry[file.replace(/\\/g, '/').match(pattern)![1]] = file;
}

export default webpackMerge(baseConfig, {
  entry,
  output: {
    path: resolve(__dirname, tsConfig.compilerOptions.outDir),
  },
});
