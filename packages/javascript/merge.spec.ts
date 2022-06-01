import { describe, expect, jest, test } from '@jest/globals';
import { deepMerge, merge } from './merge';

describe('merge', () => {
  test('merge array with other types', () => {
    let elements = [
        ['a', 'b'],
        ['c', 'd'],
        'e',
        1,
        null,
        undefined,
        true,
        { x: 1 },
      ],
      result = ['a', 'b', 'c', 'd', 'e', 1, null, undefined, true, { x: 1 }];
    expect(merge(...elements)).toEqual(result);
  });

  test('merge objects', () => {
    expect(merge({ x: 1, y: 2 }, { y: 3, z: 4 })).toEqual({
      x: 1,
      y: 3,
      z: 4,
    });
  });

  test('merge object with string', () => {
    expect(merge({ x: 1, y: 2 }, 'z')).toEqual({ x: 1, y: 2, z: undefined });
  });

  test('merge objects with numbers', () => {
    expect(() => merge({ x: 1 }, 2)).toThrow('cannot merge object with number');
  });

  test('merge strings with numbers and arrays', () => {
    expect(merge('a', 'b', ['c', 'd'], 1)).toEqual('abcd1');
  });

  test('merge a string with function', () => {
    expect(() => merge('x', () => {})).toThrow(
      'cannot merge string with function'
    );
  });

  test('merge a number with other elements', () => {
    expect(() => merge(1, 2)).toThrow('cannot merge number with number');
  });
});

describe('deepMerge', () => {
  test('merge objects', () => {
    let object1 = {
        a: 1,
        b: 2,
        c: { x: 10, y: { m: 11 } },
        d: { x: 10, y: { m: 11 } },
      },
      object2 = {
        b: 3,
        c: 4,
        d: { x: 9, y: { n: 12 } },
      },
      result = {
        a: 1,
        b: 3,
        c: 4,
        d: { x: 9, y: { n: 12, m: 11 } },
      };
    expect(deepMerge([object1, object2])).toEqual(result);
  });
});
