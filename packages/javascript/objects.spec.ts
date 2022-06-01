import { describe, expect, jest, test } from '@jest/globals';
import {
  chunk,
  cleanObject,
  filterObjectByKeys,
  flatten,
  includes,
  isEmpty,
  isIterable,
  isPromise,
  objectType,
  stringToObject,
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
  for (let element of types) {
    test(element.type, () => {
      expect(objectType(element.value)).toEqual(element.type);
    });
  }
});

describe('includes', () => {
  let array = ['x', 'y', 'z'],
    string_ = 'xyz',
    object = { x: 1, y: 2, z: 3 };

  let tests = [
    ['x', true],
    ['X', true],
    ['a', false],
    [['a', 'x'], false],
    [/x/, true],
    [/a/, false],
  ];

  for (let element of tests) {
    test(element[0].toString(), () => {
      expect(includes(element[0], array)).toEqual(element[1]);
      expect(includes(element[0], string_)).toEqual(element[1]);
      expect(includes(element[0], object)).toEqual(element[1]);

      if (Array.isArray(element[0])) {
        expect(includes(element[0], array, { elementAsItem: false })).toEqual(
          true
        );
        expect(includes(element[0], string_, { elementAsItem: false })).toEqual(
          true
        );
        expect(includes(element[0], object, { elementAsItem: false })).toEqual(
          true
        );
      }
    });
  }

  test('case sensitive', () => {
    expect(includes('X', array, { caseSensitive: true })).toEqual(false);
  });
});

describe('isIterable', () => {
  for (let element of types) {
    test(element.type, () => {
      let result = ['array', 'object'].includes(element.type) ? true : false;
      expect(isIterable(element.value)).toEqual(result);
    });
  }
});

describe('isPromise', () => {
  for (let element of types) {
    test(element.type, () => {
      expect(isPromise(element.value)).toEqual(
        element.type === 'promise' ? true : false
      );
    });
  }
});

describe('isEmpty', () => {
  for (let element of types.filter(
    (element_) => !['undefined', 'null'].includes(element_.type)
  )) {
    test(`not empty: ${element.type}`, () => {
      expect(isEmpty(element.value)).toEqual(false);
    });
  }

  for (let element of empty) {
    test(`empty: ${element.type}`, () => {
      expect(isEmpty(element.value)).toEqual(true);
    });
  }
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

test('filterObjectByKeys', () => {
  let object = { a: 1, b: 2, c: 3, d: 4 },
    keys = ['a', 'c'];
  expect(filterObjectByKeys(object, keys)).toEqual({ a: 1, c: 3 });
});

test('stringToObject', () => {
  let object = stringToObject('a.b.c', 'value');
  expect(object).toEqual({ a: { b: { c: 'value' } } });
  expect(object.a.b.c).toEqual('value');
});
test('flatten', () => {
  let object = { a: 1, b: { x: 2, y: { m1: 1, m2: 2 } } };
  let flattened = { a: 1, 'b.x': 2, 'b.y.m1': 1, 'b.y.m2': 2 };
  expect(flatten(object)).toEqual(flattened);
});
