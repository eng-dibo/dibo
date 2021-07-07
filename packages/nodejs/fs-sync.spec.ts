import { test, expect, describe, jest } from '@jest/globals';
import {
  resolve,
  parsePath,
  getExtension,
  getSize,
  isDir,
  getModifiedTime,
  mkdir,
  move,
  remove,
  read,
  write,
} from './fs-sync';
import { objectType } from '@engineers/javascript/objects';

import { exists, existsSync, writeFileSync } from 'fs';

let dir = resolve(__dirname, './test/fs-sync'),
  file1 = `${dir}/file1.txt`,
  file2 = `${dir}/file2.txt`,
  file3 = `${dir}/file3.txt`,
  file4 = `${dir}/file4.txt`,
  fileJson = `${dir}/file-json.json`,
  fileJsonComments = `${dir}/file-json-comments.json`,
  fileArray = `${dir}/file-array.json`;

test('mkdir', () => {
  expect(existsSync(dir)).toBeFalsy();
  mkdir(dir);
  expect(existsSync(dir)).toBeTruthy();
});

test('write', () => {
  expect(existsSync(file1)).toBeFalsy();
  expect(existsSync(fileJson)).toBeFalsy();
  expect(existsSync(fileArray)).toBeFalsy();

  write(file1, 'this file is generated during testing');
  write(file2, 'this file is generated during testing');
  write(file4, 'this file is generated during testing');
  write(fileJson, { x: 1, y: 2 });
  write(fileArray, [1, 2, 3]);
  write(
    fileJsonComments,
    `// this file is created to test reading .json files that contains comments
     // to test stripComments()

  {
    /* it should remove all comments */
    /* even this 
         multi-line comment 
      */
    // also this comment

    "x": 1,
    "hello": "ok"
  }
  `
  );

  expect(existsSync(file1)).toBeTruthy();
  expect(existsSync(fileJson)).toBeTruthy();
  expect(existsSync(fileArray)).toBeTruthy();
});

test('write to non-existing dir', () => {
  let file = `${dir}/non-existing/file-write.txt`;
  write(file, 'ok');
  expect(existsSync(file)).toBeTruthy();
});

test('resolve', () => {
  expect(resolve('/path', 'to/file.js')).toEqual('/path/to/file.js');
});

test('parsePath', () => {
  expect(parsePath('/path/to/file.js')).toEqual({
    type: 'file',
    dir: '/path/to',
    file: 'file',
    extension: 'js',
  });
});

test('getExtension', () => {
  expect(getExtension('/path/to/file.js')).toEqual('js');
  expect(getExtension('.gitignore')).toEqual('');
  expect(getExtension('/path/to/.gitignore')).toEqual('');
  expect(getExtension('/path/to')).toEqual('');
});

test('size units', () => {
  let size = 1234567890,
    units = { b: 0, kb: 1, mb: 2, gb: 3 };
  expect(size / 1024 ** units.mb).toBeCloseTo(1177.3, 0);
});

test('getSize', () => {
  expect(getSize(file1)).toEqual(37);
  expect(getSize(dir)).toBeGreaterThan(4000);
});

test('isDir', () => {
  expect(isDir(file1)).toEqual(false);
  expect(isDir(dir)).toEqual(true);
});

test('getModifiedTime', () => {
  expect(Math.floor(getModifiedTime(file1))).toBeGreaterThanOrEqual(
    1624906832178
  );
  expect(Math.floor(getModifiedTime(dir))).toBeGreaterThanOrEqual(
    1624906832178
  );
});

test('move', () => {
  expect(existsSync(file2)).toBeTruthy();
  move(file2, file3);
  expect(existsSync(file2)).toBeFalsy();
  expect(existsSync(file3)).toBeTruthy();
});

test('read', () => {
  let txt = read(file1),
    json = read(fileJson),
    jsonWithComments = read(fileJsonComments),
    arr = read(fileArray);

  expect(txt.length).toEqual(37);
  expect(txt).toContain('this file is generated during testing');
  expect(objectType(txt)).toEqual('string');
  expect(objectType(json)).toEqual('object');
  expect(objectType(jsonWithComments)).toEqual('object');
  expect(objectType(arr)).toEqual('array');
  expect(json).toEqual({ x: 1, y: 2 });
  expect(jsonWithComments).toEqual({ x: 1, hello: 'ok' });
  expect(arr).toEqual([1, 2, 3]);
});

test('remove non-exists path', () => {
  let file = `${dir}/non-existing/file-remove.txt`;
  remove(file);
  expect(existsSync(file)).toBeFalsy();
});

// remove all testing dir to clean the repo
// always make this test case at the end
test('remove dir', () => {
  expect(existsSync(file1)).toBeTruthy();
  expect(existsSync(dir)).toBeTruthy();
  remove([dir]);
  expect(existsSync(file1)).toBeFalsy();
  expect(existsSync(dir)).toBeFalsy();
});
