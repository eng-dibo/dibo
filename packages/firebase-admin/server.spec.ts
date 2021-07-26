import { test, expect, describe, jest } from '@jest/globals';
import server from './server';
import http from 'http';

test('server', () => {
  // todo: clean the used port before running this test
  // todo: remove the listener from the port after finishing testing
  // todo: test that httpServer is listening on the specified port
  // todo: test that httpServer.response = 200, hello world
  // todo: remove warn: `FIREBASE_CONFIG and GCLOUD_PROJECT environment variables are missing`
  //        init({...}) didn't help

  const httpServer = http.createServer((req, res) => {
    res.writeHead(200);
    res.end('Hello, World!');
  });
  expect(httpServer.listening).toBeFalsy();
  httpServer.listen(9500);
  expect(httpServer.listening).toBeTruthy();

  // test that httpServer is converted to cloudFunctions
  expect(server(httpServer).name).toEqual('cloudFunction');
});
