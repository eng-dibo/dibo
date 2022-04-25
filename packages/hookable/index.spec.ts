import { test, expect, jest, beforeEach } from '@jest/globals';
import { readFile } from 'fs/promises';
import { resolve } from 'path';
import Hookable, { LifecyclePoint } from '.';

let hookable: Hookable;
let log = jest.fn();

beforeEach(() => {
  // reset console.log calls
  jest.clearAllMocks();

  let points: LifecyclePoint[] = [
    {
      name: 'first step',
      hooks: [
        {
          name: 'hook1',
          exec: (options, pointName, store) => log('hook1 runs'),
        },
      ],
    },
  ];

  // create a hookable instance
  hookable = new Hookable(points);
});

test('run hookable', (done) => {
  hookable.run().then(() => {
    expect(log).toHaveBeenCalledWith('hook1 runs');
    expect(log).toBeCalledTimes(1);
    done();
  });
});

test('add points', (done) => {
  hookable.addPoints({
    name: 'second step',
    hooks: [{ name: 'hook2', exec: (point) => log('hook2 runs') }],
  });

  hookable.run().then(() => {
    expect(log).toHaveBeenCalledWith('hook1 runs');
    expect(log).toHaveBeenCalledWith('hook2 runs');
    expect(log).toBeCalledTimes(2);
    done();
  });
});
test('change hooks', (done) => {
  hookable.replaceHook('first step', 'hook1', {
    name: 'hook3',
    exec: (point) => log('hook3 replaces hook1'),
  });

  hookable.run().then(() => {
    expect(log).toHaveBeenCalledWith('hook3 replaces hook1');
    expect(log).toBeCalledTimes(1);
    done();
  });
});

test('promise hooks', (done) => {
  hookable.replaceHook('first step', 'hook1', {
    name: 'hook4',
    exec: () => Promise.resolve('hook4 resolved'),
  });

  hookable.run().then((lifecycle) => {
    expect(lifecycle.store['first step']['hook4']).toEqual('hook4 resolved');
    done();
  });
});

// test long-time process i.e read from a file
test('promise hooks: long-time process', (done) => {
  hookable.replaceHook('first step', 'hook1', {
    name: 'hook5',
    exec: (options, pointName, store) =>
      readFile(resolve(__dirname, './package.json'), 'utf8').then(
        () => 'hook5 resolved'
      ),
  });

  hookable.run().then((lifecycle) => {
    console.info('promise hooks2', { lifecycle });
    expect(lifecycle.store['first step']['hook5']).toEqual('hook5 resolved');
    done();
  });
});
