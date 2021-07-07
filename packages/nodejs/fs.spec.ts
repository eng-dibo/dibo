/**
 * all test cases must be in the same order as ./fs-sync.spec.ts
 * and includes exactly the same test cases.
 */

import { test, expect, describe, jest } from '@jest/globals';
import { resolve } from './fs-sync';
import {
  mkdir,
  write,
  getSize,
  isDir,
  getModifiedTime,
  move,
  read,
  remove,
} from './fs';
import { existsSync } from 'fs';
import { objectType } from '@engineers/javascript/objects';

let dir = resolve(__dirname, './test!!/fs'),
  file1 = `${dir}/file1.txt`,
  file2 = `${dir}/file2.txt`,
  file3 = `${dir}/file3.txt`,
  file4 = `${dir}/file4.txt`,
  fileJson = `${dir}/file-json.json`,
  fileJsonComments = `${dir}/file-json-comments.json`,
  fileArray = `${dir}/file-array.json`;

test('mkdir', () => {
  expect(existsSync(dir)).toBeFalsy();
  return mkdir(dir).then((value) => expect(existsSync(dir)).toBeTruthy());
});

test('write', () => {
  expect(existsSync(file1)).toBeFalsy();
  expect(existsSync(fileJson)).toBeFalsy();
  expect(existsSync(fileArray)).toBeFalsy();
  return Promise.all([
    write(file1, 'this file is generated during testing'),
    write(file2, 'this file is generated during testing'),
    write(file4, 'this file is generated during testing'),
    write(fileJson, { x: 1, y: 2 }),
    write(fileArray, [1, 2, 3]),
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
    ),
  ]).then((value) => {
    expect(existsSync(file1)).toBeTruthy();
    expect(existsSync(fileJson)).toBeTruthy();
    expect(existsSync(fileArray)).toBeTruthy();
  });
});

test('write to non-existing dir', () => {
  let _file = `${dir}/non-existing/file-write.txt`;
  return write(_file, 'ok').then(() => expect(existsSync(_file)).toBeTruthy());
});

test('getSize', () =>
  Promise.all([getSize(file1), getSize(dir)]).then((value) =>
    expect(value).toEqual([37, 4096])
  ));

test('isDir', () =>
  Promise.all([isDir(file1), isDir(dir)]).then((value) =>
    expect(value).toEqual([false, true])
  ));

test('getModifiedTime -> file', () =>
  Promise.all([getModifiedTime(file1), getModifiedTime(dir)]).then((value) => {
    expect(Math.floor(value[0])).toBeGreaterThanOrEqual(1624906832178);
    expect(Math.floor(value[1])).toBeGreaterThanOrEqual(1624906832178);
  }));

test('move', () => {
  expect(existsSync(file2)).toBeTruthy();
  return move(file2, file3).then(() => {
    expect(existsSync(file2)).toBeFalsy();
    expect(existsSync(file3)).toBeTruthy();
  });
});

test('read', () =>
  Promise.all([
    read(file1),
    read(fileJson),
    read(fileJsonComments),
    read(fileArray),
  ]).then((value) => {
    let [txt, json, jsonWithComments, arr] = value;
    expect(txt.length).toEqual(37);
    expect(txt).toContain('this file is generated during testing');
    expect(objectType(txt)).toEqual('string');
    expect(objectType(json)).toEqual('object');
    expect(objectType(jsonWithComments)).toEqual('object');
    expect(objectType(arr)).toEqual('array');
    expect(json).toEqual({ x: 1, y: 2 });
    expect(jsonWithComments).toEqual({ x: 1, hello: 'ok' });
    expect(arr).toEqual([1, 2, 3]);
  }));

test('remove non-exists path', () => {
  let file = `${dir}/non-existing/file-remove.txt`;
  return remove(file).then(() => expect(existsSync(file)).toBeFalsy());
});

test('remove dir', () => {
  expect(existsSync(file1)).toBeTruthy();
  expect(existsSync(dir)).toBeTruthy();
  return remove([dir]).then(() => {
    expect(existsSync(file1)).toBeFalsy();
    expect(existsSync(dir)).toBeFalsy();
  });
});
