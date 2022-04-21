import { test, expect, afterAll } from '@jest/globals';
import { resolve } from 'node:path';
import updaterHookable, {
  getLocalVersion,
  getRemoteVersion,
  compareVersions,
  download,
  update,
  beforeUpdate,
  afterUpdate,
} from '.';
import { remove } from '@engineers/nodejs/fs-sync';

let updater;
let testDir = resolve(__dirname, 'test');
let remote = {
  repo: 'eng-dibo/dibo',
  branch: 'main',
};

afterAll(() => {
  // remove the downloaded repo after finishing the test to fix the jest error:
  // The name `@engineers/*` was looked up in the Haste module map
  // because this package existing twice (once in tests!!/.remote and other in packages/*)
  // to solve this either remove test!!/.remote or add modulePathIgnorePatterns to jest.config
  // to ignore test!!
  remove(resolve(__dirname, 'test!!'));
});

test('getLocalVersion', (done) => {
  getLocalVersion(testDir).then((result) => {
    expect(result).toEqual('1.0.2');
    done();
  });
});

test('getRemoteVersion', (done) => {
  getRemoteVersion(remote).then((result) => {
    expect(result.match(/\d+\.\d+\.\d+/)).toBeTruthy();
    done();
  });
});

test('compareVersions', () => {
  expect(compareVersions('1.0.0', '2.0.0')).toEqual('major');
  expect(compareVersions('1.0.0', '1.1.0')).toEqual('minor');
  expect(compareVersions('1.0.0', '1.0.1')).toEqual('patch');
  expect(compareVersions('1.0.0', '1.0.0')).toEqual(undefined);
});
test('download: from code base', () => {
  return expect(
    download(
      { ...remote, release: false },
      {
        destination: resolve(__dirname, 'test!!/.remote'),
      }
    )
  ).resolves.not.toThrow();
});
test.skip('download: from code base: with token', () => {});

test('download: from code base - invalid branch', () => {
  return expect(
    download({ ...remote, release: false, branch: 'not-exists' })
  ).rejects.toThrow('Remote branch not-exists not found in upstream origin');
});
test('download: from a release', () => {
  return expect(
    download(
      { ...remote, release: 'latest' },
      {
        destination: resolve(__dirname, 'test!!/.release'),
      }
    )
  ).resolves.not.toThrow();
});
test.skip('update', (done) => {});
test.skip('beforeUpdate', (done) => {});
test.skip('afterUpdate', (done) => {});
test.skip('full process', (done) => {
  //updater.run().then(console.log);
});
test.skip('custom hooks: getLocalVersion', () => {});
test.skip('custom lifecycle point: checkUpdates', () => {});
