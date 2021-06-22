import { test, expect, describe, jest } from '@jest/globals';
import {
  objectType,
  merge,
  includes,
  isIterable,
  isPromise,
  isEmpty,
  chunk,
  cleanObject,
} from './objects';

let types = [
  { type: 'string', value: 'hello' },
  { type: 'number', value: 1 },
  { type: 'array', value: ['x', 'y'] },
  { type: 'object', value: { x: 1, y: 2 } },
  { type: 'boolean', value: true },
  { type: 'undefined', value: undefined },
  { type: 'null', value: null },
  { type: 'function', value(): void {} },
  { type: 'promise', value: new Promise((r) => r(0)) },
];

let empty = [
  { type: 'string', value: '' },
  { type: 'number', value: 0 },
  { type: 'array', value: [] },
  { type: 'object', value: {} },
  { type: 'boolean', value: false },
  { type: 'undefined', value: undefined },
  { type: 'null', value: null },
];

describe('objectType', () => {
  types.forEach((el) => {
    test(el.type, () => {
      expect(objectType(el.value)).toEqual(el.type);
    });
  });
});

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

describe('includes', () => {
  let arr = ['x', 'y', 'z'],
    str = 'xyz',
    obj = { x: 1, y: 2, z: 3 };

  let tests = [
    ['x', true],
    ['X', true],
    ['a', false],
    [['a', 'x'], false],
    [/x/, true],
    [/a/, false],
  ];

  tests.forEach((el) => {
    test(el[0].toString(), () => {
      expect(includes(el[0], arr)).toEqual(el[1]);
      expect(includes(el[0], str)).toEqual(el[1]);
      expect(includes(el[0], obj)).toEqual(el[1]);

      if (el[0] instanceof Array) {
        expect(includes(el[0], arr, { elementAsItem: false })).toEqual(true);
        expect(includes(el[0], str, { elementAsItem: false })).toEqual(true);
        expect(includes(el[0], obj, { elementAsItem: false })).toEqual(true);
      }
    });
  });

  test('case sensitive', () => {
    expect(includes('X', arr, { caseSensitive: true })).toEqual(false);
  });
});

describe('isIterable', () => {
  types.forEach((el) => {
    test(el.type, () => {
      let result = ['array', 'object'].includes(el.type) ? true : false;
      expect(isIterable(el.value)).toEqual(result);
    });
  });
});

describe('isPromise', () => {
  types.forEach((el) => {
    test(el.type, () => {
      expect(isPromise(el.value)).toEqual(el.type === 'promise' ? true : false);
    });
  });
});

describe('isEmpty', () => {
  types
    .filter((el) => !['undefined', 'null'].includes(el.type))
    .forEach((el) => {
      test(`not empty: ${el.type}`, () => {
        expect(isEmpty(el.value)).toEqual(false);
      });
    });

  empty.forEach((el) => {
    test(`empty: ${el.type}`, () => {
      expect(isEmpty(el.value)).toEqual(true);
    });
  });
});

describe('chunk', () => {
  let array = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  test('chunkSize = 0, 1, 2 ,array.length, >array.length, -1', () => {
    expect(chunk(array, 1)).toEqual([
      [1],
      [2],
      [3],
      [4],
      [5],
      [6],
      [7],
      [8],
      [9],
    ]);

    expect(chunk(array, 2)).toEqual([[1, 2], [3, 4], [5, 6], [7, 8], [9]]);

    expect(chunk(array, array.length)).toEqual([[1, 2, 3, 4, 5, 6, 7, 8, 9]]);

    expect(chunk(array, array.length + 1)).toEqual([
      [1, 2, 3, 4, 5, 6, 7, 8, 9],
    ]);

    expect(() => chunk(array, 0)).toThrow();
    expect(() => chunk(array, -1)).toThrow();
  });
});

describe('cleanObject', () => {
  test('not object', () => {
    // @ts-ignore
    expect(() => cleanObject('not object')).toThrow();
  });
  // todo: test an object that has circular references
});
