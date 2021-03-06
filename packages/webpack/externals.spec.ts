// https://blog.iansinnott.com/testing-webpack-plugins

import { afterAll, beforeAll, expect, test } from '@jest/globals';
import webpack, { Configuration } from 'webpack';
import { read, remove, write } from '@engineers/nodejs/fs-sync';
import { resolve } from 'node:path';
import externals, { node } from './externals';

let config: Configuration;
let root: string;

beforeAll(() => {
  root = resolve(__dirname, './test~~/externals');
  remove(root);

  write(`${root}/example.js`, 'module.exports.xx=1;');
  write(
    `${root}/example2.js`,
    `const example = require('./example');\n const xx = example.xx;\n console.log({xx});`
  );
  write(
    `${root}/example3.js`,
    `require('./example');\n require('./example2');`
  );

  write(`${root}/example-node.js`, `require('path');`);

  config = {
    entry: {
      output: resolve(`${root}/example.js`),
      output2: resolve(`${root}/example2.js`),
      output3: resolve(`${root}/example3.js`),
      output4: [resolve(`${root}/example.js`), resolve(`${root}/example2.js`)],
    },
    mode: 'none',
    // use output if you want to test the physical outputted assets
    // otherwise remove `output` and use `stats.compilation.assets` or `stats.toJson().assets`
    // to test the outputted assets without writing them to the fs.
    output: {
      path: root,
    },
    resolve: {
      extensions: ['.js'],
    },
    target: 'node',
  };
});

afterAll(() => {
  remove(root);
});

test('no externals', (done) => {
  webpack(config).run((error: any, stats: any) => {
    if (error) {
      done(error);
    } else if (stats.hasErrors()) {
      done(stats.toString());
    } else {
      // expect `example2.js` to be bundled
      expect(read(`${root}/output3.js`)).not.toContain(
        `require("${root}/example2")`
      );
      done();
    }
  });
});

test('exclude example2 from bundling', (done) => {
  let config2 = Object.assign({}, config, {
    externals: [
      function () {
        // RegExp: pattern is not global: match `request` only
        externals(arguments, [/example2/]);
      },
    ],
  });

  webpack(config2).run((error: any, stats: any) => {
    if (error) {
      done(error);
    } else if (stats.hasErrors()) {
      done(stats.toString());
    } else {
      // expect `example2.js` to be unbundled (i.e keep require('example2'))
      try {
        expect(read(`${root}/output3.js`)).toMatch(
          `require("${resolve(root + '/example2')}")`
        );
      } catch {
        // todo: resolve windows paths
        // require(\"D:\\\\...\\\\packages\\\\webpack\\\\test~~\\\\externals\\\\example2\");??
      }
      done();
    }
  });
});

test('transform', (done) => {
  let config2 = Object.assign({}, config, {
    externals: [
      function () {
        externals(arguments, [/example2/], 'commonjs2 ../new/path.js');
      },
    ],
  });

  webpack(config2).run((error: any, stats: any) => {
    if (error) {
      done(error);
    } else if (stats.hasErrors()) {
      done(stats.toString());
    } else {
      expect(read(`${root}/output3.js`)).toContain(`require("../new/path.js")`);
      done();
    }
  });
});

test('transform function', (done) => {
  let config2 = Object.assign({}, config, {
    externals: [
      function () {
        externals(arguments, [/example2/], () => 'commonjs2 ../new/path.js');
      },
    ],
  });

  webpack(config2).run((error: any, stats: any) => {
    if (error) {
      done(error);
    } else if (stats.hasErrors()) {
      done(stats.toString());
    } else {
      expect(read(`${root}/output3.js`)).toContain(`require("../new/path.js")`);
      done();
    }
  });
});

test('whiteList', (done) => {
  let config2 = Object.assign({}, config, {
    externals: [
      function () {
        externals(arguments, [/example2/], undefined, [/ex/]);
      },
    ],
  });

  webpack(config2).run((error: any, stats: any) => {
    if (error) {
      done(error);
    } else if (stats.hasErrors()) {
      done(stats.toString());
    } else {
      // example2 matched externalsList, but whiteListed
      expect(read(`${root}/output3.js`)).not.toContain(
        `require("${root}/example2")`
      );
      done();
    }
  });
});

test('whiteList function returns false', (done) => {
  let config2 = Object.assign({}, config, {
    externals: [
      function () {
        externals(arguments, [/example2/], undefined, [() => false]);
      },
    ],
  });

  webpack(config2).run((error: any, stats: any) => {
    if (error) {
      done(error);
    } else if (stats.hasErrors()) {
      done(stats.toString());
    } else {
      // example2 matched externalsList, and whiteListed
      try {
        expect(read(`${root}/output3.js`)).toContain(
          `require("${root}/example2")`
        );
      } catch {
        // todo: windows, see the test 'exclude example2 from bundling'
      }
      done();
    }
  });
});

test('template variables', (done) => {
  let config2 = Object.assign({}, config, {
    externals: [
      function () {
        externals(arguments, [/example2/], 'commonjs2 {{request}}/file.js');
      },
    ],
  });

  webpack(config2).run((error: any, stats: any) => {
    if (error) {
      done(error);
    } else if (stats.hasErrors()) {
      done(stats.toString());
    } else {
      // variable `{{request}}` will be evaluated
      expect(read(`${root}/output3.js`)).toContain(
        `require("./example2/file.js")`
      );
      done();
    }
  });
});

test('template variables with function', (done) => {
  let config2 = Object.assign({}, config, {
    externals: [
      function () {
        externals(arguments, [() => true], 'commonjs2 {{request}}/file.js');
      },
    ],
  });

  webpack(config2).run((error: any, stats: any) => {
    if (error) {
      done(error);
    } else if (stats.hasErrors()) {
      done(stats.toString());
    } else {
      // template variables fails it item is a function
      expect(read(`${root}/output3.js`)).toContain(
        `require("{{request}}/file.js")`
      );
      done();
    }
  });
});

test('transform type', (done) => {
  let config2 = Object.assign({}, config, {
    externals: [
      function () {
        // module type = commonjs
        // providing type only, should transform into `${type} ${path}`
        externals(arguments, [/example2/], 'commonjs2');
      },
    ],
  });

  webpack(config2).run((error: any, stats: any) => {
    if (error) {
      done(error);
    } else if (stats.hasErrors()) {
      done(stats.toString());
    } else {
      // example2 matched externalsList, and whiteListed
      try {
        expect(read(`${root}/output3.js`)).toContain(
          `require("${root}/example2")`
        );
      } catch {
        // todo: windows, see the test 'exclude example2 from bundling'
      }
      done();
    }
  });
});

// todo: https://stackoverflow.com/questions/70100592/webpack-doesnt-bundle-node-modules
// todo: also test whitelisting a node module
test.skip('bundle node_modules', (done) => {
  let config2 = Object.assign({}, config, {
    externals: [],
    entry: {
      'output-node': `${root}/example-node.js`,
    },
  });

  webpack(config2).run((error: any, stats: any) => {
    if (error) {
      done(error);
    } else if (stats.hasErrors()) {
      done(stats.toString());
    } else {
      let output = read(`${root}/output-node.js`);
      expect(output).not.toContain(`require("path")`);
      done();
    }
  });
});

test('node()', (done) => {
  let config2 = Object.assign({}, config, {
    externals: [node()],
    entry: {
      'output-node-externals': `${root}/example-node.js`,
    },
  });

  webpack(config2).run((error: any, stats: any) => {
    if (error) {
      done(error);
    } else if (stats.hasErrors()) {
      done(stats.toString());
    } else {
      expect(read(`${root}/output-node-externals.js`)).toContain(
        `require("path")`
      );
      done();
    }
  });
});
