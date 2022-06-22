import { expect, test } from '@jest/globals';
import { objectToQueryParams, queryToObject } from './url';

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

test('objectToQueryParams', () => {
  expect(objectToQueryParams({ x: 1, y: 'aa', z: undefined })).toEqual(
    'x=1&y=aa'
  );
});

// todo: test nested objects
test.skip('objectToQueryParams:nested', () => {
  expect(
    objectToQueryParams({
      x: 1,
      y: 'aa',
      z: undefined,
      obj: { a: 1 },
      arr: [1, 2],
    })
  ).toEqual('x=1&y=aa&obj.a=1&arr=1&arr=2');
});
