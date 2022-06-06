import { expect, test } from '@jest/globals';
import server from './server';
import http from 'node:http';

test('server', () => {
  // todo: clean the used port before running this test
  // todo: remove the listener from the port after finishing testing
  // todo: test that httpServer is listening on the specified port
  // todo: test that httpServer.response = 200, hello world
  // todo: remove warn: `FIREBASE_CONFIG and GCLOUD_PROJECT environment variables are missing`
  //        init({...}) didn't help

  let httpServer = http.createServer((request, response) => {
    response.writeHead(200);
    response.end('Hello, World!');
  });
  expect(httpServer.listening).toBeFalsy();
  httpServer.listen(9500);
  expect(httpServer.listening).toBeTruthy();

  // test that httpServer is converted to cloudFunctions
  expect(server(httpServer).name).toEqual('cloudFunction');
  httpServer.close();
});
