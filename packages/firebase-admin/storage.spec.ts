import { test, expect, describe, jest } from '@jest/globals';
import Storage from './storage';
import init from './init';
import { apps } from 'firebase-admin';
import { rmdirSync, unlinkSync } from 'fs';

// important: to pass this test, you need to setup the storage serviceAccount from firebase console
// and select a region

// if you initialized a non-default app, provide it to Storage()
// example:
//   init({serviceAccount, name:'testApp});
//   new Storage({ app: apps[0] })
init({ serviceAccount: __dirname + '/test/firebase.json', name: 'testApp' });

describe('storage', () => {
  let storage = new Storage({ app: apps[0] });
  test('upload', () => {
    return storage
      .upload(__dirname + '/test/flower.jpg', 'spec/flower.jpg')
      .then((result) => {
        // @ts-ignore
        let metadata = result[1];
        expect(metadata.kind).toEqual('storage#object');
        expect(metadata.name).toEqual('spec/flower.jpg');
        expect(metadata.size).toEqual('42497');
      });
  });

  test('download', () => {
    let destination = __dirname + '/test/flower-downloaded.jpg';
    return storage.download('spec/flower.jpg', destination).then((result) => {
      expect(result).toEqual([]);
      unlinkSync(destination);
    });
  });

  test('download to a non-existing directory', () => {
    let destination = __dirname + '/test/non-existing/flower-downloaded.jpg';
    return storage.download('spec/flower.jpg', destination).then((result) => {
      expect(result).toEqual([]);
      unlinkSync(destination);
      rmdirSync(__dirname + '/test/non-existing');
    });
  });
});
