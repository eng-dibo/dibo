import { test, expect } from '@jest/globals';
import { parseArgv, Argv, toArgv } from './process';

test('parseArgv() & toArgv()', () => {
  let argv =
    'cmd1 cmd2 - --a 1 --b=2 --c true --d false --e --no-f -g -h hh -ijk ok -l- --num=1 --arr=1 --arr=2 --obj.a.b=1 -mn-o -p - -q123 --whitespaces=a\nb\tc --no-exit  -- ext1 ext2';

  let result: Argv = {
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
      q: '123',
      whitespaces: 'a\nb\tc',
      exit: false,
    },
    external: 'ext1 ext2',
  };

  expect(parseArgv(argv)).toEqual(result);
  expect(toArgv(result)).toEqual(argv);
});
