import { afterAll, expect, test } from '@jest/globals';
import Storage from './index';
import { remove } from '@engineers/nodejs/fs';
import { resolve, write } from '@engineers/nodejs/fs-sync';
import { existsSync } from 'node:fs';

let serviceAccount = resolve(__dirname, './gcloud-service-account!!.json');
if (!existsSync(serviceAccount)) {
  console.warn(
    `testing for gcloud-storage skipped because the service account file does'nt exist
    to run the test create "gclud-service-account!!.json" contains your own service account
    note that files that end with "!!" or "~~" don't be committed to the remote repository for security`
  );
} else {
  let bucket = 'testing.appspot.com';
  let storage = new Storage({ bucket, keyFilename: serviceAccount });
  write(__dirname + '/test~~/file.json', { ok: 1 });

  afterAll(() => {
    // delete all files
    // todo: delete the entire folder
    return Promise.all(
      ['file.json'].map((file) => storage.delete(`${bucket}/${file}`))
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
    return storage
      .download(`${bucket}/file.json`, destination)
      .then((result) => {
        expect(result).toEqual(true);
      });
  });

  test('download as Buffer', () => {
    return storage.download(`${bucket}/file.json`).then((result) => {
      expect(result).toMatchObject({ ok: 1 });
    });
  });

  test('download non-existing file', () => {
    return expect(
      storage.download(`${bucket}/non-existing.txt`)
    ).rejects.toThrow('No such object');
  });

  test('download to a non-existing directory', () => {
    let destination = __dirname + '/test~~/non-existing/file.json';
    return storage
      .download(`${bucket}/file.json`, destination)
      .then((result) => {
        expect(result).toEqual(true);
      });
  });

  test('delete', () => {
    return storage.delete(`${bucket}/note.txt`).then((result) => {
      expect(result).toBeTruthy();
    });
  });

  test('delete non-existing file', () => {
    return expect(
      storage.delete(`${bucket}/none-existing.txt`)
    ).rejects.toThrow('No such object');
  });
}
