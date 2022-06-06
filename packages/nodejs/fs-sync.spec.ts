import { afterEach, beforeEach, describe, expect, test } from '@jest/globals';
import {
  copy,
  getEntries,
  getExtension,
  getModifiedTime,
  getSize,
  isDir,
  mkdir,
  move,
  parsePath,
  read,
  remove,
  resolve,
  write,
} from './fs-sync';
import { objectType } from '@engineers/javascript/objects';

import { existsSync, readFileSync, utimesSync } from 'node:fs';

let dir = resolve(__dirname, './test!!/fs-sync'),
  file = dir + '/file.txt';

beforeEach(() => {
  remove(dir);
  write(file, 'ok');
});

afterEach(() => remove(dir));

test('mkdir', () => {
  expect(existsSync(`${dir}/mkdir`)).toBeFalsy();
  mkdir(`${dir}/mkdir`);
  expect(existsSync(`${dir}/mkdir`)).toBeTruthy();
});

test('write', () => {
  mkdir(dir);
  expect(existsSync(`${dir}/write.txt`)).toBeFalsy();
  write(`${dir}/write.txt`, 'ok');
  expect(existsSync(`${dir}/write.txt`)).toBeTruthy();
  expect(readFileSync(`${dir}/write.txt`).toString()).toEqual('ok');
});

test('write in non-existing dir', () => {
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
  let size = 1_234_567_890,
    units = { b: 0, kb: 1, mb: 2, gb: 3 };
  expect(size / 1024 ** units.mb).toBeCloseTo(1177.3, 0);
});

test('getSize', () => {
  write(`${dir}/get-size/file1.txt`, 'ok');
  write(`${dir}/get-size/file2.txt`, 'ok');
  expect(getSize(`${dir}/get-size/file1.txt`)).toEqual(2);
  expect(getSize(`${dir}/get-size`)).toEqual(4);
  expect(
    getSize([`${dir}/get-size/file1.txt`, `${dir}/get-size/file2.txt`])
  ).toEqual(4);
});

test('isDir', () => {
  expect(isDir(file)).toEqual(false);
  expect(isDir(dir)).toEqual(true);
});

test('getModifiedTime', () => {
  expect(Math.floor(getModifiedTime(file))).toBeGreaterThanOrEqual(
    1_624_906_832_178
  );
  expect(Math.floor(getModifiedTime(dir))).toBeGreaterThanOrEqual(
    1_624_906_832_178
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
    array = read(fileArray);

  expect(txt.length).toEqual(2);
  expect(txt).toContain('ok');
  expect(objectType(txt)).toEqual('string');
  expect(objectType(json)).toEqual('object');
  expect(objectType(jsonWithComments)).toEqual('object');
  expect(objectType(array)).toEqual('array');
  expect(json).toEqual({ x: 1, y: 2 });
  expect(jsonWithComments).toEqual({ x: 1, hello: 'ok' });
  expect(array).toEqual([1, 2, 3]);
});

test('read from a non-existing file', () => {
  expect(() => read(`${dir}/non-existing.txt`, { age: 24 * 60 * 60 })).toThrow(
    'no such file or directory'
  );
});

test('read: age', () => {
  let file = dir + '/file.txt';
  write(file, 'ok');
  expect(read(file, { age: 24 * 60 * 60 })).toEqual('ok');
});

test('read from an expired cache', () => {
  let file = dir + '/file.txt';
  write(file, 'ok');
  let date = new Date(),
    today = date.getDate();
  date.setDate(today - 1);
  // in seconds
  let yesterday = date.getTime() / 1000;

  // set creation and modified time to yesterday
  utimesSync(file, yesterday, yesterday);
  expect(() => read(file, { age: 1 })).toThrow('expired file');
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

test('copy a directory and its sub-directories', () => {
  write(`${dir}/copy-dir/file.txt`, '');
  write(`${dir}/copy-dir/sub-dir/file2.txt`, '');
  copy(`${dir}/copy-dir`, `${dir}/copy-dir2`);
  expect(existsSync(`${dir}/copy-dir2/file.txt`)).toBeTruthy();
  expect(existsSync(`${dir}/copy-dir2/sub-dir/file2.txt`)).toBeTruthy();
});

describe('getEntries', () => {
  let entries = ['file.txt', 'file.js'];
  beforeEach(() => {
    for (let element of entries) {
      write(`${dir}/${element}`, '');
      write(`${dir}/subdir/${element}`, '');
    }
  });

  test('list all entries recursively', () => {
    expect(getEntries(dir).sort()).toEqual(
      // all files in dir with full path
      [
        ...entries
          .map((element) => `${dir}/${element}`)
          // all files in subdir
          .concat(entries.map((element) => `${dir}/subdir/${element}`)),
        dir + '/subdir',
      ].sort()
    );
  });

  test('filter by function', () => {
    // list all js files only
    expect(getEntries(dir, (element) => element.includes('.js'))).toEqual([
      dir + '/file.js',
      dir + '/subdir/file.js',
    ]);
  });

  test('filter by regex', () => {
    expect(getEntries(dir, /subdir/).sort()).toEqual(
      [
        ...entries.map((element) => `${dir}/subdir/${element}`),
        `${dir}/subdir`,
      ].sort()
    );
  });

  test('filter by type: files', () => {
    expect(getEntries(dir, 'files').sort()).toEqual(
      entries
        .map((element) => `${dir}/${element}`)
        .concat(entries.map((element) => `${dir}/subdir/${element}`))
        .sort()
    );
  });
  test('filter by type: dirs', () => {
    expect(getEntries(dir, 'dirs')).toEqual([dir + '/subdir']);
  });

  test('depth=0', () => {
    for (let element of entries) {
      write(`${dir}/subdir/extra/${element}`, '');
    }

    expect(getEntries(dir, undefined, 0).sort()).toEqual(
      [...entries.map((element) => `${dir}/${element}`), dir + '/subdir'].sort()
    );
  });

  test('depth=1', () => {
    for (let element of entries) {
      write(`${dir}/subdir/extra/${element}`, '');
    }

    expect(getEntries(dir, undefined, 1).sort()).toEqual(
      [
        ...entries.map((element) => `${dir}/${element}`),
        dir + '/subdir',
        dir + '/subdir/extra',
      ]
        .concat(entries.map((element) => `${dir}/subdir/${element}`))
        .sort()
    );
  });

  test('depth=2', () => {
    for (let element of entries) {
      write(`${dir}/subdir/extra/${element}`, '');
    }

    expect(getEntries(dir, undefined, 2).sort()).toEqual(
      [
        ...entries.map((element) => `${dir}/${element}`),
        dir + '/subdir',
        dir + '/subdir/extra',
      ]
        .concat(entries.map((element) => `${dir}/subdir/${element}`))
        .concat(entries.map((element) => `${dir}/subdir/extra/${element}`))
        .sort()
    );
  });

  test('non existing dir', () => {
    expect(() => getEntries(dir + '/non-existing')).toThrow(
      'no such file or directory'
    );
  });
});

// kfnjngfjlngl
