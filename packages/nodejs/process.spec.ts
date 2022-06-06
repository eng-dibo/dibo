import { expect, test } from '@jest/globals';
import { Argv, parseArgv, toArgv } from './process';

let input =
  'cmd1 cmd2 - --a 1 --b=2 --c true --d false --e --no-f -g -h hh -ijk ok -l- --num=1 --arr=1 --arr=2 --obj.a.b=1 -mn-o -p - -q123 --whitespaces=a\nb\tc --no-exit -- ext1 ext2';

let parsed: Argv = {
  cmd: ['cmd1', 'cmd2', '-'],
  options: {
    a: 1,
    b: 2,
    c: true,
    d: false,
    e: true,
    f: false,
    g: true,
    h: 'hh',
    i: true,
    j: true,
    k: 'ok',
    l: '-',
    num: 1,
    arr: [1, 2],
    obj: { a: { b: 1 } },
    m: true,
    n: '-o',
    p: '-',
    q: 123,
    whitespaces: 'a\nb\tc',
    exit: false,
  },
  external: 'ext1 ext2',
};

test('parseArgv()', () => {
  expect(parseArgv(input)).toEqual(parsed);
});

test('parseArgv(): contains extra spaces', () => {
  expect(parseArgv('cmd --a=1  --b=2')).toEqual({
    cmd: ['cmd'],
    options: { a: 1, b: 2 },
    external: '',
  });
});

test('toArgv()', () => {
  let parsedArguments = {
    cmd: ['cmd1', 'cmd2'],
    options: { a: 'x', b: 1, c: true, d: false, e: { f: 1 }, g: [1, 2] },
    external: '--external params',
  };

  let arguments_ = `cmd1 cmd2 --a=x --b=1 --c=true --d=false --e.f=1 --g=1 --g=2 -- --external params`;
  expect(toArgv(parsedArguments)).toEqual(arguments_);
});
