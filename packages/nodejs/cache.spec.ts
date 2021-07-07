import { test, expect, describe, jest, afterAll } from '@jest/globals';
import cache from './cache';
import { write, remove } from './fs';
import { resolve } from './fs-sync';

let dir = resolve(__dirname, './test!!/cache'),
  file1 = `${dir}/file1.txt`,
  file2 = `${dir}/file2.txt`,
  file3 = `${dir}/file3.txt`,
  file4 = `${dir}/file4.txt`,
  fileJson = `${dir}/file-json.json`,
  fileJsonComments = `${dir}/file-json-comments.json`,
  fileArray = `${dir}/file-array.json`;

test('read from an existing cached file', () =>
  write(file1, 'content#1')
    .then(() => cache(file1, () => 'content#2'))
    .then((value) => expect(value).toEqual('content#1')));

test('create a new cache', () =>
  cache(file2, () => 'content#2').then((value) =>
    expect(value).toEqual('content#2')
  ));

test('read from multiple cache paths, one of them exists', () =>
  write(file1, 'content#1')
    .then(() => remove([file2, file3]))
    .then(() => cache([file3, file1, file2], () => 'content#3'))
    .then((value) => expect(value).toEqual('content#1')));

test('read from multiple cache paths, non exists', () =>
  remove([file3, file4])
    .then(() => cache([file3, file4], () => 'content#3'))
    .then((value) => expect(value).toEqual('content#3')));

test('read from .json file', () =>
  write(fileJson, { x: 1 })
    .then(() => cache(fileJson, () => 'nothing'))
    .then((value) => expect(value).toEqual({ x: 1 })));

// clean the repo
afterAll(() => remove(dir));
