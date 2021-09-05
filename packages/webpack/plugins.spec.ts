import {
  test,
  expect,
  beforeAll,
  beforeEach,
  afterAll,
  jest,
} from '@jest/globals';
import BasePlugin from './plugins';
import webpack, { Configuration } from 'webpack';
import { write, remove } from '@engineers/nodejs/fs-sync';
import { resolve } from 'path';

let config: any;
let root: string;

beforeAll(() => {
  root = resolve(__dirname, './test~~/plugins');
  remove(root);
  console.log = jest.fn();

  write(`${root}/example.js`, '');

  config = {
    mode: 'none',
    entry: {
      output: `${root}/example.js`,
    },
    resolve: {
      extensions: ['.js'],
    },
  };
});

beforeEach(() => {
  // reset console.log calls
  jest.clearAllMocks();
});

afterAll(() => {
  remove(root);
});

test('the plugin should be created and attached to webpack', (done) => {
  class ExamplePlugin extends BasePlugin {
    hooks = () => {
      console.log('ExamplePlugin', this.options);
    };
  }

  let config2 = Object.assign({}, config, {
    plugins: [new ExamplePlugin('ok')],
  });

  webpack(config2).run((err: any, stats: any) => {
    if (err) {
      done(err);
    } else if (stats.hasErrors()) {
      done(stats.toString());
    } else {
      expect(console.log).toHaveBeenCalledWith('ExamplePlugin', 'ok');
      done();
    }
  });
});

test('multiple hooks', (done) => {
  class ExamplePlugin extends BasePlugin {
    hooks = [
      () => {
        console.log('ExamplePlugin hook #1', this.options);
      },
      () => {
        console.log('ExamplePlugin hook #2', this.options);
      },
    ];
  }

  let config2 = Object.assign({}, config, {
    plugins: [new ExamplePlugin('ok')],
  });

  webpack(config2).run((err: any, stats: any) => {
    if (err) {
      done(err);
    } else if (stats.hasErrors()) {
      done(stats.toString());
    } else {
      expect(console.log).toHaveBeenCalledTimes(2);
      expect(console.log).toHaveBeenCalledWith('ExamplePlugin hook #1', 'ok');
      expect(console.log).toHaveBeenCalledWith('ExamplePlugin hook #2', 'ok');
      done();
    }
  });
});

test('the plugin can access and modify stats', (done) => {
  class ExamplePlugin extends BasePlugin {
    hooks = [
      {
        lifecycle: 'afterCompile',
        hook: (stats: any) => {
          stats.hash = '~example~';
          console.log('afterCompile', stats.hash);
        },
      },
      {
        lifecycle: 'done',
        hook: (stats: any) => {
          console.log('done', stats.hash);
        },
      },
    ];
  }

  let config2 = Object.assign({}, config, {
    plugins: [new ExamplePlugin()],
  });

  webpack(config2).run((err: any, stats: any) => {
    if (err) {
      done(err);
    } else if (stats.hasErrors()) {
      done(stats.toString());
    } else {
      expect(console.log).toHaveBeenCalledTimes(2);
      expect(console.log).toHaveBeenCalledWith('afterCompile', '~example~');
      expect(console.log).toHaveBeenCalledWith('done', '~example~');
      done();
    }
  });
});
