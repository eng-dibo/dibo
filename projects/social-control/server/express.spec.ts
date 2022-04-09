import { test, expect, beforeAll, describe } from '@jest/globals';
import { server } from './express';
import { Express } from 'express';
import EventEmitter from 'events';
import supertest from 'supertest';

let app: Express;
beforeAll(() => {
  app = server();
});
test('server', () => {
  expect(app).toBeTruthy();
  expect(app.constructor).toEqual(EventEmitter);
});

// testing routes via SuperTest
// https://dev.to/lukekyl/testing-your-express-js-backend-server-3ae6
// todo: fix: jest transpiles this file in place, so __dirname will give a different value
// than its value in the transpiled file via tsc or webpack because te output path is different
describe('routes', () => {
  test('/collections', () => {
    return supertest(app)
      .get('/collections')
      .then((response) => {
        console.log({ response });
        expect(response.status).toEqual(200);
        expect(response.type).toEqual(expect.stringContaining('json'));
        expect(response.body.message).toEqual('pass!');
      });
  });
});

// todo: test app.use(*)
