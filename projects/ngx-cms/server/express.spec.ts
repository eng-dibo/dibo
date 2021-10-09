import { test, expect, beforeAll } from '@jest/globals';
import { server } from './express';
import { Express } from 'express';
import EventEmitter from 'events';

let app: Express;
beforeAll(() => {
  app = server();
});
test('server', () => {
  expect(app).toBeTruthy();
  expect(app.constructor).toEqual(EventEmitter);
});

// todo: test app.use(*)
