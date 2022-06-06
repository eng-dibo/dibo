import { afterAll, beforeEach, expect, test } from '@jest/globals';
import request from './https';

test('request', (done) => {
  request(`https://jsonplaceholder.typicode.com/posts/1`)
    .then((result) => {
      expect(result.userId).toEqual(1);
      done();
    })
    .catch((error) => done(error));
});

test('request: POST', (done) => {
  request(`https://jsonplaceholder.typicode.com/posts`, {
    title: 'test post request',
  })
    .then((result) => {
      expect(result.title).toEqual('test post request');
      done();
    })
    .catch((error) => done(error));
});

test('request: catching errors', () =>
  expect(
    request(`https://jsonplaceholder.typicode.com/wrong-endpoint`)
  ).rejects.toEqual({ code: 404 }));
