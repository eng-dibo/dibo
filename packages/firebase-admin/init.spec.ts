// https://firebase.google.com/docs/functions/unit-testing#testing_background_non-http_functions
import { describe, expect, jest, test } from '@jest/globals';
import init, { InitOptions } from './init';
import { apps } from 'firebase-admin';

const config: InitOptions = {
  name: 'testApp',
  serviceAccount: __dirname + '/test/firebase.json',
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
