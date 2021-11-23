import { test, expect, afterAll } from '@jest/globals';
import Storage from './storage';
import init from './init';
import { apps } from 'firebase-admin';
import { rmdirSync, unlinkSync } from 'fs';
import { remove } from '@engineers/nodejs/fs';

// important: to pass this test, you need to setup the storage serviceAccount from firebase console
// and select a region

// if you initialized a non-default app, provide it to Storage()
// example:
//   init({serviceAccount, name});
//   new Storage({ app: apps[0] })
init({ serviceAccount: __dirname + '/test/firebase.json', name: 'testApp' });

let bucket = 'test/package-firebase-admin';
let storage = new Storage({ app: apps[0], bucket });

afterAll(() => {
  // delete all files
  // todo: delete the entire folder
  return Promise.all(
    ['flower.jpg'].map((file) => storage.delete(`${bucket}/${file}`))
  ).then(() => remove(__dirname + '/test!!'));
});

test('upload', () => {
  return storage
    .upload(__dirname + '/test/flower.jpg', `${bucket}/flower.jpg`)
    .then((result) => {
      // @ts-ignore
      let metadata = result[1];
      expect(metadata.kind).toEqual('storage#object');
      expect(metadata.name).toEqual(`${bucket}/flower.jpg`);
      expect(metadata.size).toEqual('42497');
    });
});

test('write', () => {
  // test a promise that resolves to void
  // https://stackoverflow.com/a/59293963/12577650
  return expect(
    storage.write(`${bucket}/note.txt`, 'ok')
  ).resolves.not.toThrow();
});

test('download', () => {
  let destination = __dirname + '/test!!/flower-downloaded.jpg';
  return storage
    .download(`${bucket}/flower.jpg`, destination)
    .then((result) => {
      expect(result).toEqual([]);
      unlinkSync(destination);
    });
});

test('download non-existing file', () => {
  return expect(
    storage.download(`${bucket}/non-existing.txt`, '')
  ).rejects.toThrow('No such object');
});

test('download to a non-existing directory', () => {
  let destination = __dirname + '/test!!/non-existing/flower-downloaded.jpg';
  return storage
    .download(`${bucket}/flower.jpg`, destination)
    .then((result) => {
      expect(result).toEqual([]);
      unlinkSync(destination);
      rmdirSync(__dirname + '/test!!/non-existing');
    });
});

test('delete', () => {
  return storage.delete(`${bucket}/note.txt`).then((result) => {
    expect(result).toBeTruthy();
  });
});

test('delete non-existing file', () => {
  return expect(storage.delete(`${bucket}/none-existing.txt`)).rejects.toThrow(
    'No such object'
  );
});
