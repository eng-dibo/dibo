import { Configuration } from 'webpack';
// todo: use aliases (i.e: ./packages/* -> @engineers/*)
// webpack uses `ts-node` to compile webpack.config.ts
// add `tsconfig-paths` to `tsconfig['ts-node']` to add tsConfig's paths to webpack's aliases
import { node } from './packages/webpack/externals';
import { resolve } from 'path';
import BasePlugin from './packages/webpack/plugins';

class FilterErrors extends BasePlugin {
  hooks = [
    {
      lifecycle: 'afterCompile',
      name: 'filterErrors',
      hook: (compilation: any) => {
        let pattern =
          /export '.+?'( \(reexported as '.+?'\))?? was not found in/i;
        compilation.errors = compilation.errors.filter(
          (el: any) => !pattern.test(el.message)
        );
      },
    },
  ];
}

let config: Configuration = {
  // change 'mode' by env, example: `npx cross-env NODE_ENV=production`
  mode: 'none',
  target: 'node',
  resolve: {
    extensions: ['.tsx', '.ts', '.jsx', '.js'],
    symlinks: false,
    alias: {
      // add '~' for each project as the project's root
      '~~': resolve(__dirname, './'),
      '@engineers': resolve(__dirname, './packages/'),
    },
  },
  externals: [
    // add node_modules to externals in target:node
    // except:
    //   - @engineers/* -> not compiled or published, imported from source
    //   -*.scss files
    //   - ~* (i.e: ~config|browser|server/*) -> to prevent it from transforming to `commnjs2 ~config/*`
    //     so it can be properly transformed to 'commonjs ../config/*'
    node(undefined, [/@engineers\/.+/, /\.s?css$/, /^~/]),
  ],
  output: {
    path: resolve(__dirname, './dist'),
    library: undefined,
    libraryTarget: 'commonjs2',
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: 'ts-loader',
        options: {
          // todo: extends: '../tsconfig.json',
          compilerOptions: {
            sourceMap: false,
          },
          // only compile files bundled by webpack, instead of the provided in tsconfig.json
          // by include, exclude, files
          // same as files:[webpack.entry]
          // https://www.npmjs.com/package/ts-loader#onlycompilebundledfiles
          onlyCompileBundledFiles: true,
          configFile: resolve(__dirname, './tsconfig.json'),
        },
      },
      {
        // load .node files
        // example: ./node_modules/sharp/build/Release/sharp.node
        // https://github.com/lovell/sharp/issues/794#issuecomment-307188099
        test: /\.node$/,
        loader: 'node-loader',
        options: { name: '[name]-[contenthash].[ext]' },
      },
      /*
      // causes the error: Unknown word
      // https://github.com/webpack-contrib/css-loader/issues/295#issuecomment-265724126
       {
        test: /\.css$/,
        // loader: 'css-loader',
        use: ['style-loader', 'css-loader'],
        // use: [{loader: 'css-loader', options:options: opts.loaders.css}]
      },*/
    ],
  },
  plugins: [new FilterErrors()],
};

export default config;
