// https://blog.iansinnott.com/testing-webpack-plugins

import { test, expect, beforeAll, afterAll } from '@jest/globals';
import webpack from 'webpack';
import { write, remove, getSize } from '@engineers/nodejs/fs-sync';
import { resolve } from 'path';
import { existsSync } from 'fs';
import externals, { node } from './externals';

let config: any;
let root: string;

beforeAll(() => {
  root = resolve(__dirname, './test~~/externals');
  remove(root);

  write(`${root}/example.js`, 'module.exports.xx=1;');
  write(
    `${root}/example2.js`,
    `const example = require('./example');\n const xx = example.xx;\n console.log({xx});`
  );

  config = {
    mode: 'none',
    entry: {
      output: `${root}/example.js`,
      output2: `${root}/example2.js`,
      output3: [`${root}/example.js`, `${root}/example2.js`],
    },
    resolve: {
      extensions: ['.js'],
    },
    // use output if you want to test the physical outputted assets
    // otherwise remove `output` and use `stats.assets` to test the outputted assets
    // without writing them to the fs.
    output: {
      path: `${root}/dist`,
      // to be compatible with the default externals().transform
      libraryTarget: 'commonjs2',
    },
  };
});

afterAll(() => {
  remove(root);
});

test('externals(): param list', () => {
  // RegExp: pattern is not global: match `request` only
  expect(
    externals([/example/])(
      {
        request: './src/example.js',
        context: '/home/project',
      },
      () => {}
    )
  ).toEqual({
    matched: /example/,
    transform: 'commonjs2 /home/project/src/example.js',
  });

  expect(
    externals([/example/])(
      {
        request: './src/file.js',
        context: '/home/project/example',
      },
      () => {}
    )
  ).toEqual('whitelisted');

  // RegExp: pattern is global -> match the full `path`
  expect(
    externals([/example/g])(
      {
        request: './src/file.js',
        context: '/home/project/example',
      },
      () => {}
    )
  ).toEqual({
    matched: /example/g,
    transform: 'commonjs2 /home/project/example/src/file.js',
  });

  // function: return true to add to externals
  let fn = () => true;
  expect(
    externals([fn])(
      {
        request: './src/example.js',
        context: '/home/project',
      },
      () => {}
    )
  ).toEqual({
    matched: fn,
    transform: 'commonjs2 /home/project/src/example.js',
  });

  // function: return false to whitelist
  expect(
    externals([() => false])(
      {
        request: './src/example.js',
        context: '/home/project',
      },
      () => {}
    )
  ).toEqual('whitelisted');
});

test('externals(): param transform', () => {
  let fn = () => true;

  // string
  expect(
    externals([fn], 'amd ./another/path')(
      {
        request: './src/example.js',
        context: '/home/project',
      },
      () => {}
    )
  ).toEqual({ matched: fn, transform: 'amd ./another/path' });

  // function
  expect(
    externals([fn], () => 'amd ./another/path')(
      {
        request: './src/example.js',
        context: '/home/project',
      },
      () => {}
    )
  ).toEqual({ matched: fn, transform: 'amd ./another/path' });

  // using template variables
  expect(
    externals([fn], 'amd {{path}}')(
      {
        request: './src/example.js',
        context: '/home/project',
      },
      () => {}
    )
  ).toEqual({ matched: fn, transform: 'amd /home/project/src/example.js' });

  // providing type only, should transform into `${type} ${path}`
  expect(
    externals([fn], 'amd')(
      {
        request: './src/example.js',
        context: '/home/project',
      },
      () => {}
    )
  ).toEqual({ matched: fn, transform: 'amd /home/project/src/example.js' });
});

test('externals(): param whitelist', () => {
  expect(
    externals([/.*/], undefined, [/example/])(
      {
        request: './src/example.js',
        context: '/home/project',
      },
      () => {}
    )
  ).toEqual('whitelisted');
});

test('node(): add node_modules to externals', () => {
  // should add node packages to externals
  expect(
    node()(
      {
        request: 'fs',
        context: '/home/project',
      },
      () => {}
    )
  ).toMatchObject({ transform: 'commonjs2 fs' });

  // path to node_modules
  expect(
    node()(
      {
        request: './src/node_modules/fs',
        context: '/home/project',
      },
      () => {}
    )
  ).toMatchObject({ transform: 'commonjs2 /home/project/src/node_modules/fs' });

  // whitelist a package
  expect(
    node(undefined, ['fs'])(
      {
        request: 'fs',
        context: '/home/project',
      },
      () => {}
    )
  ).toEqual('whitelisted');

  // normal path
  expect(
    node()(
      {
        request: './src/example.js',
        context: '/home/project',
      },
      () => {}
    )
  ).toEqual('whitelisted');
});

// running tests by webpack compiler via webpack node api

test('webpack should compile the project', (done) => {
  webpack(config).run((err: any, stats: any) => {
    if (err) {
      done(err);
    } else if (stats.hasErrors()) {
      // or stats.compilation.errors
      done(stats.toString());
    } else {
      let assets = stats.toJson().assets;
      let output = assets.filter((el: any) => el.name === 'output.js')[0];

      expect(output.emitted).toEqual(true);
      expect(existsSync(`${root}/dist/output.js`)).toEqual(true);
      done();
    }
  });
});

test('externals: without externals()', (done) => {
  let config2 = Object.assign({}, config, {
    externals: [/example/],
    // don't override 'output2' from the previous test
    // because it created with a different config
    entry: { output4: `${root}/example2.js` },
  });

  webpack(config2).run((err: any, stats: any) => {
    if (err) {
      done(err);
    } else if (stats.hasErrors()) {
      done(stats.toString());
    } else {
      // 'output4.js' should be smaller than 'output2.js'
      // since the module 'example' has been added to externals, i.e: excluded from bundling
      expect(getSize(`${root}/dist/output4.js`)).toBeLessThan(
        getSize(`${root}/dist/output2.js`)
      );
      done();
    }
  });
});

test('externals: with externals()', (done) => {
  let config2 = Object.assign({}, config, {
    externals: [externals([/example/])],
    entry: { output5: `${root}/example2.js` },
  });

  webpack(config2).run((err: any, stats: any) => {
    if (err) {
      done(err);
    } else if (stats.hasErrors()) {
      done(stats.toString());
    } else {
      // 'output5.js' should be identical to 'output4.js'
      expect(getSize(`${root}/dist/output5.js`)).toEqual(
        getSize(`${root}/dist/output4.js`)
      );
      done();
    }
  });
});
