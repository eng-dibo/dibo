import { test, expect, describe, jest } from '@jest/globals';
import { replaceAll, replaceAsync } from './string';

describe('replaceAll', () => {
  test('string', () => {
    let str = 'abxycdxy';
    expect(replaceAll(str, 'x', 'Z')).toEqual('abZycdZy');
    expect(replaceAll(str, ['x', 'y'], 'Z')).toEqual('abZZcdZZ');
    expect(replaceAll(str, 'x', 1)).toEqual('ab1ycd1y');
  });

  test('array', () => {
    let array = ['abxycdxy', 'xyz'];
    expect(replaceAll(array, 'x', 'Z')).toEqual(['abZycdZy', 'Zyz']);
    expect(replaceAll(array, ['x', 'y'], 'Z')).toEqual(['abZZcdZZ', 'ZZz']);
    expect(replaceAll(array, 'x', 1)).toEqual(['ab1ycd1y', '1yz']);
  });
});

describe('replaceAsync', () => {
  let element = 'a-b-c-d',
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
