import { Configuration } from 'webpack';
// todo: use aliases (i.e: ./packages/* -> @engineers/*)
// webpack uses `ts-node` to compile webpack.config.ts
// add `tsconfig-paths` to `tsconfig['ts-node']` to add tsConfig's paths to webpack's aliases
import { resolve } from 'node:path';
import BasePlugin from './packages/webpack/plugins';
import TsconfigPathsPlugin from 'tsconfig-paths-webpack-plugin';

class FilterErrors extends BasePlugin {
  hooks = [
    {
      lifecycle: 'afterCompile',
      name: 'filterErrors',
      hook: (compilation: any) => {
        let pattern =
          /export '.+?'( \(reexported as '.+?'\))?? was not found in/i;
        compilation.errors = compilation.errors.filter(
          (element: any) => !pattern.test(element.message)
        );
      },
    },
  ];
}

let config: Configuration = {
  mode: (process.env.NODE_ENV || 'none') as any,
  target: 'node',
  resolve: {
    extensions: ['.tsx', '.ts', '.jsx', '.js'],
    symlinks: false,
    /* use TsconfigPathsPlugin
    alias: {
      // add '~' for each project as the project's root
      '~~': resolve(__dirname, './'),
      '@engineers': resolve(__dirname, './packages/'),
    },*/
    // add tsconfig paths to webpack alias
    plugins: [new TsconfigPathsPlugin()],
  },

  output: {
    path: resolve(__dirname, './dist'),
    filename: '[name].js',
    library: {
      // todo: esm `type: 'module'`
      // replaces output.libraryTarget
      type: 'commonjs2',
    },
    // todo: esm
    // chunkFormat: 'module',
    // module: true,
    clean: true,
  },
  experiments: {
    // todo: esm
    // outputModule: true,
  },
  module: {
    // see packages/webpack/native-require.js
    noParse: /\/native-require.js$/,
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
