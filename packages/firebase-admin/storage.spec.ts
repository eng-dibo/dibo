import { test, expect, afterAll } from '@jest/globals';
import Storage from './storage';
import init from './init';
import { remove } from '@engineers/nodejs/fs';
import { write } from '@engineers/nodejs/fs-sync';

// important: to pass this test, you need to setup the storage serviceAccount from firebase console
// and select a region

// if you initialized a non-default app, provide it to Storage()
// example:
//   init({serviceAccount, name});
//   new Storage({ app: apps[0] })
let app = init({
  serviceAccount: __dirname + '/test/firebase.json',
  name: 'testApp',
});

let bucket = 'test/package-firebase-admin';
let storage = new Storage({ app });
write(__dirname + '/test~~/file.json', { ok: 1 });

afterAll(() => {
  // delete all files
  // todo: delete the entire folder
  return Promise.all(
    ['file.json', 'note.txt'].map((file) => storage.delete(`${bucket}/${file}`))
  ).then(() => remove(__dirname + '/test~~'));
});

test('upload', () => {
  return storage
    .upload(__dirname + '/test~~/file.json', `${bucket}/file.json`)
    .then((result) => {
      // @ts-ignore
      let metadata = result[1];
      expect(metadata.kind).toEqual('storage#object');
      expect(metadata.name).toEqual(`${bucket}/file.json`);
      expect(metadata.size).toEqual('8');
    });
});

test('write', () => {
  // test a promise that resolves to void
  // https://stackoverflow.com/a/59293963/12577650
  // todo: test if file exists in the cloud
  return expect(
    storage.write(`${bucket}/note.txt`, 'ok')
  ).resolves.not.toThrow();
});

test('download to a destination', () => {
  let destination = __dirname + '/test~~/file.json';
  return storage.download(`${bucket}/file.json`, destination).then((result) => {
    expect(result).toEqual(true);
  });
});

test('download as Buffer', () => {
  return storage.download(`${bucket}/file.json`).then((result) => {
    expect(result).toMatchObject({ ok: 1 });
  });
});

test('download non-existing file', () => {
  return expect(storage.download(`${bucket}/non-existing.txt`)).rejects.toThrow(
    'No such object'
  );
});

test('download to a non-existing directory', () => {
  let destination = __dirname + '/test~~/non-existing/file.json';
  return storage.download(`${bucket}/file.json`, destination).then((result) => {
    expect(result).toEqual(true);
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
