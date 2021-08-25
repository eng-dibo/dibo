/**
 * all test cases must be in the same order as ./fs-sync.spec.ts
 * and includes exactly the same test cases.
 */

import { test, expect, beforeEach, afterEach, describe } from '@jest/globals';
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
  file = dir + '/file.txt';

afterEach(() => {
  remove(dir);
});

describe('clean state', () => {
  test('mkdir', () => {
    expect(existsSync(dir)).toBeFalsy();
    return mkdir(dir).then((value) => expect(existsSync(dir)).toBeTruthy());
  });

  test('write', () => {
    expect(existsSync(file)).toBeFalsy();
    return mkdir(dir)
      .then(() => write(file, 'ok'))
      .then(() => {
        expect(existsSync(file)).toBeTruthy();
      });
  });

  test('write in non-existing dir', () => {
    let file2 = dir + '/non-existing/file.txt';
    expect(existsSync(file2)).toBeFalsy();
    return write(file2, 'ok').then(() => {
      expect(existsSync(file2)).toBeTruthy();
    });
  });
});

describe('auto create files and clean test dir', () => {
  beforeEach(() => {
    return write(file, 'ok');
  });

  afterEach(() => {
    return remove(dir);
  });

  test('getSize', () =>
    Promise.all([getSize(file), getSize(dir)]).then((value) =>
      expect(value).toEqual([2, 4096])
    ));

  test('isDir', () =>
    Promise.all([isDir(file), isDir(dir)]).then((value) =>
      expect(value).toEqual([false, true])
    ));

  test('getModifiedTime -> file', () =>
    Promise.all([getModifiedTime(file), getModifiedTime(dir)]).then((value) => {
      expect(Math.floor(value[0])).toBeGreaterThanOrEqual(1624906832178);
      expect(Math.floor(value[1])).toBeGreaterThanOrEqual(1624906832178);
    }));

  test('move', () => {
    let file2 = dir + '/file2.txt';
    expect(existsSync(file)).toBeTruthy();
    expect(existsSync(file2)).toBeFalsy();
    return move(file, file2).then(() => {
      expect(existsSync(file)).toBeFalsy();
      expect(existsSync(file2)).toBeTruthy();
    });
  });

  test('read', () => {
    let fileJson = dir + '/file.json',
      fileArray = dir + '/array.json',
      fileJsonComments = dir + '/comments.json';

    let contentJsonComments = `
    // this file is created to test reading .json files that contains comments
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
   `;

    return Promise.all([
      read(file),
      write(fileJson, { x: 1, y: 2 }).then(() => read(fileJson)),
      write(fileArray, [1, 2, 3]).then(() => read(fileArray)),
      write(fileJsonComments, contentJsonComments).then(() =>
        read(fileJsonComments)
      ),
    ]).then((value) => {
      let [txt, json, arr, jsonWithComments] = value;
      expect(txt.length).toEqual(2);
      expect(txt).toContain('ok');
      expect(objectType(txt)).toEqual('string');
      expect(objectType(json)).toEqual('object');
      expect(objectType(jsonWithComments)).toEqual('object');
      expect(objectType(arr)).toEqual('array');
      expect(json).toEqual({ x: 1, y: 2 });
      expect(jsonWithComments).toEqual({ x: 1, hello: 'ok' });
      expect(arr).toEqual([1, 2, 3]);
    });
  });

  test('remove dir', () => {
    expect(existsSync(file)).toBeTruthy();
    expect(existsSync(dir)).toBeTruthy();
    return remove([dir]).then(() => {
      expect(existsSync(file)).toBeFalsy();
      expect(existsSync(dir)).toBeFalsy();
    });
  });

  test('remove non-exists path', () => {
    let file2 = `${dir}/non-existing/file.txt`;
    return remove(file2).then(() => expect(existsSync(file2)).toBeFalsy());
  });
});
