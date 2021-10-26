import { test, expect } from '@jest/globals';
import { parse } from './operations';

let operations = {
  'find:users/1?x=1&y=2': {
    operation: 'find',
    database: undefined,
    collection: 'users',
    query: { x: '1', y: '2' },
    // todo: portion to be parsed into {id:1}
    portions: ['1'],
  },
  'users/5:2': {
    operation: 'find',
    database: undefined,
    collection: 'users',
    portions: ['5:2'],
    query: {},
    // todo: query: { skip: 4, limit: 2 },
  },
  'users/~email,mobile': {
    operation: 'find',
    database: undefined,
    collection: 'users',
    portions: ['~email,mobile'],
    query: {},
    // todo: query: { fields: 'email,mobile' },
  },
  'users/5:~email@id>3,age>20': {
    operation: 'find',
    database: undefined,
    collection: 'users',
    portions: ['5:~email@id>3,age>20'],
    query: {},
    // todo: query: { condition: 'id>3,age>20' },
  },
  'delete:users/1': {
    operation: 'delete',
    database: undefined,
    collection: 'users',
    portions: ['1'],
    query: {},
    // todo: query: { condition: 'id=1' },
  },
  'delete:users/5:2': {
    operation: 'delete',
    database: undefined,
    collection: 'users',
    portions: ['5:2'],
    query: {},
    // todo: query: { skip: 5, limit: 2 },
  },
  'delete:users/@id>3': {
    operation: 'delete',
    database: undefined,
    collection: 'users',
    portions: ['@id>3'],
    query: {},
    // todo: query: { condition: 'id>3' },
  },
  'deleteOne:users/@id>3': {
    operation: 'deleteOne',
    database: undefined,
    collection: 'users',
    portions: ['@id>3'],
    query: {},
    // todo: query: { condition: 'id>3' },
  },
  'index:users/field1,field2:indexName;field3': {
    operation: 'index',
    database: undefined,
    collection: 'users',
    // consumer has to parse portions based on the operation
    portions: ['field1,field2:indexName;field3'],
    query: {},
  },
  'index:users': {
    operation: 'index',
    database: undefined,
    collection: 'users',
    portions: [],
    query: {},
  },
  'dropIndex:users/index1,index2': {
    operation: 'dropIndex',
    database: undefined,
    collection: 'users',
    portions: ['index1,index2'],
    query: {},
  },
  'drop:users': {
    operation: 'drop',
    database: undefined,
    collection: 'users',
    portions: [],
    query: {},
  },
  'insert:users/{x:1,y:2}': {
    operation: 'insert',
    database: undefined,
    collection: 'users',
    portions: ['{x:1,y:2}'],
    query: {},
  },
  'update:users/selector/data': {
    operation: 'update',
    database: undefined,
    collection: 'users',
    portions: ['selector', 'data'],
    query: {},
  },
  'users/~^_': {
    operation: 'find',
    database: undefined,
    collection: 'users',
    portions: ['~^_'],
    query: {},
    // consumer to match fields against a regex pattern,
    // if the database driver support this feature
    // query: { fields: '^' },
  },
};

for (let key in operations) {
  if (operations.hasOwnProperty(key)) {
    test(`parse: ${key}`, () => {
      expect(parse(key)).toEqual(operations[key as keyof typeof operations]);
    });
  }
}
