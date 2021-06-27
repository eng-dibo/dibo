import { test, expect, describe, jest } from '@jest/globals';
import { escape, toRegExp } from './regex';

test('escape', () => {
  expect(escape('a[bc{d}[e]f')).toEqual('a\\[bc\\{d\\}\\[e\\]f');
});

test('toRegExp', () => {
  expect(toRegExp('x')).toEqual(/x/);
  expect(toRegExp('x[y]')).toEqual(/x\[y\]/);
});
