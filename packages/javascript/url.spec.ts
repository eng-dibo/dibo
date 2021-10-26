import { test, expect } from '@jest/globals';
import { queryToObject } from './url';

test('queryToObject()', () => {
  expect(queryToObject('?a=1&b=2&b=3&c=4&d=%5Barray%5D&e=1=2&f')).toEqual({
    a: '1',
    // todo: b=[2,3]
    b: '3',
    c: '4',
    // encoded string
    d: '[array]',
    // value includes '='
    e: '1=2',
    f: '',
  });
});
