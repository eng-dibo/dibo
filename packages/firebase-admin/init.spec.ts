// https://firebase.google.com/docs/functions/unit-testing#testing_background_non-http_functions
import { test, expect, describe, jest } from '@jest/globals';
import init, { InitOptions } from './init';
import { apps } from 'firebase-admin';

const config: InitOptions = {
  serviceAccount: __dirname + '/test/firebase.json',
  name: 'testApp',
};

test('init', () => {
  let app = init(config);
  // or apps[0]?.name
  expect(app.name).toEqual('testApp');
});

test('reinitialize an existing app', () => {
  expect(() => init(config)).toThrow(
    'Firebase app named "testApp" already exists.'
  );
});
