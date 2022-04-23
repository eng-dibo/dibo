import { test, expect, afterAll } from '@jest/globals';
import { resolve } from 'node:path';
import updaterHookable, {
  getLocalVersionHook,
  getRemoteVersionHook,
  compareVersionsHook,
  downloadHook,
  backupLocalPackageHook,
  updateHook,
  beforeUpdateHook,
  afterUpdateHook,
} from '.';
import { remove, read } from '@engineers/nodejs/fs-sync';
import { write } from '@engineers/nodejs/fs';
import { existsSync } from 'node:fs';

let testDir = resolve(__dirname, 'test!!'),
  remote = {
    repo: 'eng-dibo/dibo',
    branch: 'main',
  },
  store = {
    localPath: testDir,
    checkUpdates: { getLocalVersion: '1.0.0', getRemoteVersion: '2.0.0' },
  };

// remove the downloaded repo after finishing the test to fix the jest error:
// The name `@engineers/*` was looked up in the Haste module map
// because this package existing twice (once in tests!!/.remote and other in packages/*)
// to solve this either remove test!!/.remote or add modulePathIgnorePatterns to jest.config
// to ignore test!!
afterAll(() => remove(testDir));

test('getLocalVersionHook', (done) => {
  write(`${testDir}/package.json`, { version: '1.0.2' }).then(() =>
    getLocalVersionHook(testDir, 'pointName', store).then((result) => {
      expect(result).toEqual('1.0.2');
      done();
    })
  );
});

test('getLocalVersionHook: get localPath from store', (done) => {
  write(`${testDir}/package.json`, { version: '1.0.2' }).then(() =>
    getLocalVersionHook(undefined, 'pointName', { localPath: testDir }).then(
      (result) => {
        expect(result).toEqual('1.0.2');
        done();
      }
    )
  );
});

test('getRemoteVersionHook', (done) => {
  getRemoteVersionHook(remote, 'pointName', store).then((result) => {
    expect(result.match(/\d+\.\d+\.\d+/)).toBeTruthy();
    done();
  });
});

test('compareVersionsHook', () => {
  expect(
    compareVersionsHook(
      { localVersion: '1.0.0', remoteVersion: '2.0.0' },
      'pointName',
      store
    )
  ).toEqual('major');

  expect(
    compareVersionsHook(
      { localVersion: '1.0.0', remoteVersion: '1.1.0' },
      'pointName',
      store
    )
  ).toEqual('minor');
  expect(
    compareVersionsHook(
      { localVersion: '1.0.0', remoteVersion: '1.0.1' },
      'pointName',
      store
    )
  ).toEqual('patch');
  expect(
    compareVersionsHook(
      { localVersion: '1.0.0', remoteVersion: '1.0.0' },
      'pointName',
      store
    )
  ).toEqual(undefined);

  // get versions from store
  expect(compareVersionsHook({} as any, 'pointName', store)).toEqual('major');
});
test('downloadHook: from code base', () => {
  return expect(
    downloadHook(
      {
        remote: { ...remote, release: false },
        destination: resolve(testDir, '.remote-codebase'),
      },
      'pointName',
      store
    )
  ).resolves.not.toThrow();
});
test.skip('downloadHook: from code base: with token', () => {});

test('downloadHook: from code base - invalid branch', () => {
  return expect(
    downloadHook(
      {
        remote: { ...remote, release: false, branch: 'not-exists' },
      },
      'pointName',
      store
    )
  ).rejects.toThrow('Remote branch not-exists not found in upstream origin');
});

// make sure there is a release with tag 'latest'
test('downloadHook: from a release', () => {
  return expect(
    downloadHook(
      {
        remote: { ...remote, release: 'latest' },
        destination: resolve(testDir, '/.remote-release'),
      },
      'pointName',
      store
    ).catch((error) => {
      if (error.message === 'Not Found') {
        console.info(
          '[download: from a release] to run this test make sure that there is a release with "latest" tag'
        );
      } else {
        throw new Error(error);
      }
    })
  ).resolves.not.toThrow();
});

test('backupLocalPackageHook', (done) => {
  backupLocalPackageHook(
    {
      localPath: resolve(__dirname),
      destination: resolve(testDir, '.backup'),
    },
    'pointName',
    store
  )
    .then(() => {
      expect(existsSync(resolve(testDir, '.backup/package.json'))).toBeTruthy();
      done();
    })
    .catch((error) => done(error));
});

test('updateHook', (done) => {
  let dir = `${testDir}/updateHook`;

  write(`${dir}/package.json`, { version: '0.0.0' })
    .then(() =>
      Promise.all([
        write(`${dir}/.remote/package.json`, {
          version: '1.0.0',
        }),
        write(`${dir}/.remote/index.js`, 'let x=1;'),
      ])
    )
    .then(() =>
      updateHook(
        {
          localPath: dir,
          remotePath: `${dir}/.remote`,
        },
        'pointName',
        { update: { backup: `${dir}/.backup` } }
      )
    )
    .then(() => {
      expect(read(`${dir}/package.json`)).toEqual({
        version: '1.0.0',
      });
      expect(existsSync(`${dir}/index.js`)).toBeTruthy();
      done();
    })
    .catch((error) => done(error));
});
test.skip('beforeUpdateHook', (done) => {});
test.skip('afterUpdateHook', (done) => {});
test.skip('full process', (done) => {
  //updater.run().then(console.log);
});
test.skip('custom hooks: getLocalVersion', () => {});
test.skip('custom lifecycle point: checkUpdates', () => {});
