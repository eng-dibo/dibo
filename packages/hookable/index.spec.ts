import { test, expect, jest, beforeAll, beforeEach } from '@jest/globals';
import Hookable, { LifecyclePoint } from '.';

let hookable: Hookable;

beforeAll(() => {
  let points: LifecyclePoint[] = [
    {
      name: 'first step',
      hooks: [
        {
          name: 'hook1',
          exec: (options, pointName, store) => console.log('hook1 runs'),
        },
      ],
    },
  ];

  // create a hookable instance
  hookable = new Hookable(points);

  // spy on console.log
  console.log = jest.fn();
});

beforeEach(() => {
  // reset console.log calls
  jest.clearAllMocks();
});

test('run hookable', (done) => {
  hookable.run().then(() => {
    expect(console.log).toHaveBeenCalledWith('hook1 runs');
    expect(console.log).toBeCalledTimes(1);
    done();
  });
});

test('add points', (done) => {
  hookable.addPoints({
    name: 'second step',
    hooks: [{ name: 'hook2', exec: (point) => console.log('hook2 runs') }],
  });

  hookable.run().then(() => {
    expect(console.log).toHaveBeenCalledWith('hook1 runs');
    expect(console.log).toHaveBeenCalledWith('hook2 runs');
    expect(console.log).toBeCalledTimes(2);
    done();
  });
});
test('change hooks', (done) => {
  hookable.replaceHook('first step', 'hook1', {
    name: 'hook3',
    exec: (point) => console.log('hook3 replaces hook1'),
  });

  hookable.run().then(() => {
    expect(console.log).toHaveBeenCalledWith('hook3 replaces hook1');
    expect(console.log).toHaveBeenCalledWith('hook2 runs');
    expect(console.log).toBeCalledTimes(2);
    done();
  });
});
