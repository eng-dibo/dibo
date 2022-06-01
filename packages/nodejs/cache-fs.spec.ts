import { afterAll, beforeEach, expect, test } from '@jest/globals';
import cache from './cache-fs';
import { remove, write } from './fs';
import { resolve } from './fs-sync';

let dir = resolve(__dirname, './test!!/cache');

beforeEach(() => remove(`${dir}/file.txt`));
afterAll(() => remove(dir));

test('create a new cache', () =>
  cache(`${dir}/new-file.txt`, () => 'content').then((value) =>
    expect(value).toEqual('content')
  ));

test('read from an existing cached file', () =>
  write(`${dir}/file-uguihgkuhkgj.txt`, 'content#1')
    .then(() => cache(`${dir}/file-uguihgkuhkgj.txt`, () => 'content#2'))
    .then((value) => expect(value).toEqual('content#1')));

test('read from multiple cache paths, one of them exists - case1', () =>
  write(`${dir}/multiple-case1/file.txt`, 'content#1')
    .then(() =>
      cache(
        [
          `${dir}/multiple-case1/file.txt`,
          `${dir}/none1.txt`,
          `${dir}/none2.txt`,
        ],
        () => 'content#3'
      )
    )
    .then((value) => expect(value).toEqual('content#1')));

test('read from multiple cache paths, one of them exists - case2', () =>
  write(`${dir}/multiple-case2/file.txt`, 'content#1')
    .then(() =>
      cache(
        [
          `${dir}/none1.txt`,
          `${dir}/multiple-case2/file.txt`,
          `${dir}/none2.txt`,
        ],
        () => 'content#3'
      )
    )
    .then((value) => expect(value).toEqual('content#1')));

test('read from multiple cache paths, non exists', () =>
  cache([`${dir}/none3.txt`, `${dir}/none4.txt`], () => 'content').then(
    (value) => expect(value).toEqual('content')
  ));

test('read from .json file', () =>
  write(`${dir}/file.json`, { x: 1 })
    .then(() => cache(`${dir}/file.json`, () => 'nothing'))
    .then((value) => expect(value).toEqual({ x: 1 })));

test('read from a Promise dataSource', () =>
  cache(`${dir}/promise.txt`, () => {
    return new Promise((r) => r('content'));
  }).then((value) => expect(value).toEqual('content')));

// lajaghj
