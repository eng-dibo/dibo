// https://firebase.google.com/docs/functions/unit-testing#testing_background_non-http_functions
import { test, expect, describe, jest } from '@jest/globals';
import init, { InitOptions } from './init';
import { apps } from 'firebase-admin';
import firebaseFunctionsTest from 'firebase-functions-test';

const config: InitOptions = {
  // using serviceAccount for 'xxyyzz2050'
  serviceAccount: __dirname + '/test/firebase.json',
  name: 'testApp',
};

test('init', () => {
  init(config);
  expect(apps[0]?.name).toEqual('testApp');
});

test('reinitialize an existing app', () => {
  expect(() => init(config)).toThrow(
    'Firebase app named "testApp" already exists.'
  );
});
