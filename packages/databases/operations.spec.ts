import { test, expect } from '@jest/globals';
import { parse } from './operations';

let operations = {
  'find:users/1?x=1&y=2': {
    operation: 'find',
    database: undefined,
    collection: 'users',
    portions: [],
    query: { id: '1', x: '1', y: '2' },
  },
  'users/1': {
    operation: 'find',
    database: undefined,
    collection: 'users',
    portions: [],
    query: { id: '1' },
  },
  'users/5:2': {
    operation: 'find',
    database: undefined,
    collection: 'users',
    portions: [],
    query: { skip: 5, limit: 2 },
  },
  'users/~email,mobile': {
    operation: 'find',
    database: undefined,
    collection: 'users',
    portions: [],
    query: { fields: 'email,mobile' },
  },
  'users/5:~email@id>3,age>20': {
    operation: 'find',
    database: undefined,
    collection: 'users',
    portions: [],
    query: { skip: 5, fields: 'email', condition: 'id>3,age>20' },
  },
  'delete:users/5:2': {
    operation: 'delete',
    database: undefined,
    collection: 'users',
    portions: [],
    query: { skip: 5, limit: 2 },
  },
  'delete:users/@id>3': {
    operation: 'delete',
    database: undefined,
    collection: 'users',
    portions: [],
    query: { condition: 'id>3' },
  },
  'deleteOne:users/@id>3': {
    operation: 'deleteOne',
    database: undefined,
    collection: 'users',
    // portions are not parsed for 'deleteOne' operation
    portions: ['@id>3'],
    query: {},
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
    portions: [],
    query: { id: 'selector', data: 'data' },
  },
};

for (let key in operations) {
  if (operations.hasOwnProperty(key)) {
    test(`parse: ${key}`, () => {
      expect(parse(key)).toEqual(operations[key as keyof typeof operations]);
    });
  }
}
