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
} from './fs-sync';
import { objectType } from '@engineers/javascript/objects';

import { existsSync, writeFileSync } from 'fs';

let file = resolve(__dirname, './test/test.txt'),
  dir = resolve(__dirname, './test'),
  subdir = `${dir}/subdir/xx`,
  myfile = `${dir}/myfile.txt`,
  myfile2 = `${dir}/myfile2.txt`,
  myfile3 = `${dir}/myfile3.txt`;

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
  expect(getSize(file)).toEqual(117);
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

writeFileSync(myfile, 'this file is generated during testing');
writeFileSync(myfile3, 'this file is generated during testing');

test('mkdir', () => {
  remove(subdir);
  expect(existsSync(subdir)).toBeFalsy();
  mkdir(subdir);
  expect(existsSync(subdir)).toBeTruthy();
});

test('move', () => {
  expect(existsSync(myfile)).toBeTruthy();
  move(myfile, myfile2);
  expect(existsSync(myfile)).toBeFalsy();
  expect(existsSync(myfile2)).toBeTruthy();
});

test('remove', () => {
  remove([myfile2, myfile3]);
  expect(existsSync(myfile2)).toBeFalsy();
  expect(existsSync(myfile3)).toBeFalsy();
});

test('remove dir', () => {
  mkdir(subdir);
  writeFileSync(`${subdir}/file1.txt`, '');
  writeFileSync(`${subdir}/file2.txt`, '');
  expect(existsSync(`${subdir}/file1.txt`)).toBeTruthy();
  expect(existsSync(subdir)).toBeTruthy();
  remove(subdir);
  expect(existsSync(subdir)).toBeFalsy();
});

test('read', () => {
  let txt = read(`${dir}/test.txt`),
    obj = read(`${dir}/test.json`),
    arr = read(`${dir}/test-array.json`);

  expect(txt.length).toEqual(117);
  expect(txt).toContain('this file is created to test fs functions');
  expect(objectType(txt)).toEqual('string');
  expect(objectType(obj)).toEqual('object');
  expect(objectType(arr)).toEqual('array');
  expect(obj).toEqual({ x: 1, hello: 'ok' });
  expect(arr).toEqual([1, 2, 3]);
});
