import { describe, expect, jest, test } from '@jest/globals';
import { escape, toFilter, toRegExp } from './regex';

test('escape', () => {
  expect(escape('a[bc{d}[e]f')).toEqual('a\\[bc\\{d\\}\\[e\\]f');
});

test('toRegExp', () => {
  expect(toRegExp('x')).toEqual(/x/);
  expect(toRegExp('x[y]')).toEqual(/x\[y\]/);
  expect(toRegExp(['x', 'y'])).toEqual(/x|y/);
});

test('toFilter: string', () => {
  expect(toFilter('x')).toEqual(expect.any(Function));
  expect(toFilter('x')('x')).toEqual(true);
  expect(toFilter('x')('y')).toEqual(false);
});

test('toFilter: regex', () => {
  expect(toFilter(/x/)).toEqual(expect.any(Function));
  expect(toFilter(/x/)('x')).toEqual(true);
  expect(toFilter(/x/)('y')).toEqual(false);
});
test('toFilter: Array<string>', () => {
  expect(toFilter(['x', 'y'])).toEqual(expect.any(Function));
  expect(toFilter(['x', 'y'])('x')).toEqual(true);
  expect(toFilter(['x', 'y'])('y')).toEqual(true);
  expect(toFilter(['x', 'y'])('z')).toEqual(false);
});
