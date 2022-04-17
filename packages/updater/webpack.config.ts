
  import webpackMerge from 'webpack-merge';
  import { Configuration } from 'webpack';
  import baseConfig from '~~webpack.config';
  import { resolve } from 'node:path';
  import { getEntries, read } from '@engineers/nodejs/fs-sync';
  
  let tsConfig = read(resolve(__dirname, 'tsconfig.json'));
  let entry:{[key:string]:string} = {};
  let pattern = new RegExp(`${__dirname}/(.+).ts$`);
  getEntries(__dirname, /(?<!.config|.spec).ts$/).forEach((file) => {
    entry[file.match(pattern)[1]] = file;
  });
  
  export default webpackMerge(baseConfig, {
    entry,
    output: {
      path: resolve(__dirname, tsConfig.compilerOptions.outDir),
    },
  });
