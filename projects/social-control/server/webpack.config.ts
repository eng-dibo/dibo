import { resolve } from 'node:path';
import baseConfig from '~webpack.config';
import { Configuration } from 'webpack';
import webpackMerge from 'webpack-merge';
import externals, { node } from '@engineers/webpack/externals';
import { getEntries, read } from '@engineers/nodejs/fs-sync';

let entry = {};
let tsConfig = read(resolve(__dirname, 'tsconfig.json'));
/*
// see externals(~server)
let pattern = new RegExp(`${__dirname}\/(.+)\.ts$`);
// express.ts already added by angular.server.options.main
getEntries(__dirname, /(?<!\.config|\.spec|\/express|\/main)\.ts$/).forEach((file) => {
    entry[file.match(pattern)[1]] = file;
  });
  */

// merge using 'webpackMerge', so arrays are merged
let config: Configuration = webpackMerge(baseConfig, {
  entry,
  output: {
    path: resolve(__dirname, tsConfig.compilerOptions.outDir),
    // todo: use the original filename, i.e: express not main
    filename: '[name].js',
  },
  externals: [
    /*
       add node_modules to externals in target:node
       except:
       - @engineers/* -> not compiled or published, imported from source
       -*.scss files
       - ~* (i.e: ~config|browser|server/*) -> to prevent it from transforming to `commnjs2 ~config/*`
         so it can be properly transformed to 'commonjs ../config/*'
       - @babel/runtime -> temporary to solve the error `SyntaxError: Unexpected token 'export'`
         when using as async/await function (todo: why it should excluded from webpack.externals)
    */
    /* todo: fix: some packages (like @angular/*, @ngx-formly/*) couldn't be handled as commonjs
      as a temporary workaround remove node() from externals[]
      and manually add 'sharp'
   */
    // node(undefined, [/@engineers\/.+/, /\.s?css$/, /^~/, /@babel\/runtime/]),
    function () {
      externals(arguments, [/sharp/], 'commonjs2 {{request}}');
    },
    function () {
      externals(
        arguments,
        [/^~{1,2}config\/(.*)/],
        'commonjs2 ../config/{{$1}}'
      );
    },
    /*
    // use require('./other-file') instead of bundling all server files into a single file
    // add each file to entry to be compiles separately
    // todo: does it better for reducing the cost of cpu usage?
    // https://cloud.google.com/compute/docs/cpu-platforms
    function () {
      externals(arguments, [/^~server\/(.*)/], 'commonjs2 ./{{$1}}');
    },
    */
  ],
});

// use tsconfig.json for server
let tsLoader = config.module!.rules!.find(
  // todo: (el: RuleSetRule)
  (el: any) => el.loader === 'ts-loader'
) as { [key: string]: any };

if (tsLoader) {
  tsLoader.options!.configFile = resolve(__dirname, './tsconfig.json');
}

export default config;
