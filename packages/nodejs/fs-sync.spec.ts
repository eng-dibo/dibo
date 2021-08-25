import { test, expect, beforeEach, afterEach, describe } from '@jest/globals';
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

import { existsSync, readFileSync } from 'fs';

let dir = resolve(__dirname, './test!!/fs-sync'),
  file = dir + '/file.txt';

afterEach(() => {
  remove(dir);
});

// run these tests in a clean state, i.e: before creating `dir` or any file
describe('clean state', () => {
  test('mkdir', () => {
    expect(existsSync(dir)).toBeFalsy();
    mkdir(dir);
    expect(existsSync(dir)).toBeTruthy();
  });

  test('write', () => {
    mkdir(dir);
    expect(existsSync(file)).toBeFalsy();
    write(file, 'ok');
    expect(existsSync(file)).toBeTruthy();
    expect(readFileSync(file).toString()).toEqual('ok');
  });

  test('write in non-existing dir', () => {
    let file2 = dir + '/non-existing/file.txt';
    expect(existsSync(file2)).toBeFalsy();
    write(file2, 'ok');
    expect(existsSync(file2)).toBeTruthy();
    expect(readFileSync(file2).toString()).toEqual('ok');
  });
});

describe('auto create files and clean test dir', () => {
  beforeEach(() => {
    write(file, 'ok');
  });

  afterEach(() => {
    remove(dir);
  });

  test('write to non-existing dir', () => {
    let file2 = dir + '/non-existing/file.txt';
    expect(existsSync(file2)).toBeFalsy();
    write(file2, 'ok');
    expect(existsSync(file2)).toBeTruthy();
    expect(readFileSync(file2).toString()).toEqual('ok');
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
    expect(getSize(file)).toEqual(2);
    expect(getSize(dir)).toBeGreaterThan(4000);
  });

  test('isDir', () => {
    expect(isDir(file)).toEqual(false);
    expect(isDir(dir)).toEqual(true);
  });

  test('getModifiedTime', () => {
    expect(Math.floor(getModifiedTime(file))).toBeGreaterThanOrEqual(
      1624906832178
    );
    expect(Math.floor(getModifiedTime(dir))).toBeGreaterThanOrEqual(
      1624906832178
    );
  });

  test('move', () => {
    let file2 = dir + '/file2.txt';
    expect(existsSync(file)).toBeTruthy();
    expect(existsSync(file2)).toBeFalsy();
    move(file, file2);
    expect(existsSync(file)).toBeFalsy();
    expect(existsSync(file2)).toBeTruthy();
  });

  test('read', () => {
    let fileJson = dir + '/file.json',
      fileArray = dir + '/array.json',
      fileJsonComments = dir + '/comments.json';

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

    let txt = read(file),
      json = read(fileJson),
      jsonWithComments = read(fileJsonComments),
      arr = read(fileArray);

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

  test('remove dir', () => {
    expect(existsSync(file)).toBeTruthy();
    expect(existsSync(dir)).toBeTruthy();
    remove(dir);
    expect(existsSync(file)).toBeFalsy();
    expect(existsSync(dir)).toBeFalsy();
  });

  test('remove non-exists path', () => {
    let file2 = `${dir}/non-existing/file.txt`;
    remove(file2);
    expect(existsSync(file2)).toBeFalsy();
  });
});
