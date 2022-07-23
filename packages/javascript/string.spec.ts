import { describe, expect, jest, test } from '@jest/globals';
import { replaceAll, replaceAsync, toNumber } from './string';

describe('replaceAll', () => {
  test('string', () => {
    let string_ = 'abxycdxy';
    expect(replaceAll(string_, 'x', 'Z')).toEqual('abZycdZy');
    expect(replaceAll(string_, ['x', 'y'], 'Z')).toEqual('abZZcdZZ');
    expect(replaceAll(string_, 'x', '1')).toEqual('ab1ycd1y');
  });

  test('array', () => {
    let array = ['abxycdxy', 'xyz'];
    expect(replaceAll(array, 'x', 'Z')).toEqual(['abZycdZy', 'Zyz']);
    expect(replaceAll(array, ['x', 'y'], 'Z')).toEqual(['abZZcdZZ', 'ZZz']);
    expect(replaceAll(array, 'x', '1')).toEqual(['ab1ycd1y', '1yz']);
  });
});

describe('replaceAsync', () => {
  let element = 'a-b-c-d',
    // eslint-disable-next-line unicorn/consistent-function-scoping
    replacer = (): Promise<string> => new Promise((r) => r('x'));

  test('non-global regex, replaces the first occurrence only', () => {
    return replaceAsync(element, /-/, replacer).then((result) =>
      expect(result).toEqual('axb-c-d')
    );
  });

  test('global regex (recursive)', () => {
    return replaceAsync(element, /-/g, replacer).then((result) =>
      expect(result).toEqual('axbxcxd')
    );
  });
});

test('toNumber()', () => {
  expect(toNumber(1)).toEqual(1);
  expect(toNumber('1')).toEqual(1);
  expect(toNumber('-1.5')).toEqual(-1.5);
  expect(toNumber('+1.5e-5')).toEqual(1.5e-5);
  expect(toNumber('0xFF')).toEqual(0xff);
  expect(toNumber('0XFF')).toEqual(0xff);
});
