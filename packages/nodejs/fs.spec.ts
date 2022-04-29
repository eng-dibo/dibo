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
  getEntries,
  copy,
} from './fs';
import { existsSync } from 'node:fs';
import { objectType } from '@engineers/javascript/objects';
import { utimes } from 'node:fs/promises';

let dir = resolve(__dirname, './test!!/fs'),
  file = dir + '/file.txt';

// remove $dir before and after each test
beforeEach(() => remove(dir).then(() => write(file, 'ok')));
afterEach(() => remove(dir));

test('mkdir', () => {
  expect(existsSync(`${dir}/mkdir`)).toBeFalsy();
  return mkdir(`${dir}/mkdir`).then((value) =>
    expect(existsSync(dir)).toBeTruthy()
  );
});

test('write', () => {
  expect(existsSync(`${dir}/write.txt`)).toBeFalsy();
  return mkdir(dir)
    .then(() => write(`${dir}/write.txt`, 'ok'))
    .then(() => {
      expect(existsSync(`${dir}/write.txt`)).toBeTruthy();
    });
});

test('write in non-existing dir', () => {
  let file2 = dir + '/non-existing/file.txt';
  expect(existsSync(file2)).toBeFalsy();
  return write(file2, 'ok').then(() => {
    expect(existsSync(file2)).toBeTruthy();
  });
});

test('getSize', () =>
  write(`${dir}/get-size/file1.txt`, 'ok')
    .then(() =>
      Promise.all([
        getSize(`${dir}/get-size/file1.txt`),
        getSize(`${dir}/get-size`),
        getSize([`${dir}/get-size/file1.txt`, `${dir}/get-size/file2.txt`]),
      ])
    )
    .then((value) => expect(value).toEqual([2, 4, 4])));

test('getSize', () => {
  write(`${dir}/get-size/file1.txt`, 'ok');
  write(`${dir}/get-size/file2.txt`, 'ok');
  expect(getSize(`${dir}/get-size/file1.txt`)).toEqual(2);
  expect(getSize(`${dir}/get-size`)).toEqual(4);
  expect(
    getSize([`${dir}/get-size/file1.txt`, `${dir}/get-size/file2.txt`])
  ).toEqual(4);
});

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

test('read from a non-existing file', () => {
  expect(
    read(`${dir}/non-existing.txt`, { age: 24 * 60 * 60 })
  ).rejects.toEqual('no such file or directory');
});

test('read: age', (done) => {
  let file = dir + '/file.txt';
  write(file, 'ok')
    .then(() => read(file, { age: 24 * 60 * 60 }))
    .then((content) => {
      expect(content).toEqual('ok');
      done();
    })
    .catch((error) => done(error));
});

test('read from an expired cache', () => {
  let file = dir + '/file.txt';

  let date = new Date(),
    today = date.getDate();
  date.setDate(today - 1);
  // in seconds
  let yesterday = date.getTime() / 1000;
  return expect(
    write(file, 'ok')
      .then(() => utimes(file, yesterday, yesterday))
      .then(() => read(file, { age: 1 }))
  ).rejects.toEqual('expired file');
});

test('remove a dir', () => {
  expect(existsSync(file)).toBeTruthy();
  expect(existsSync(dir)).toBeTruthy();
  return remove([dir]).then(() => {
    expect(existsSync(file)).toBeFalsy();
    expect(existsSync(dir)).toBeFalsy();
  });
});

test('remove a non-exists path', () => {
  let file2 = `${dir}/non-existing/file.txt`;
  return remove(file2).then(() => expect(existsSync(file2)).toBeFalsy());
});

test.only('copy a directory and its sub-directories', () => {
  return Promise.all([
    write(`${dir}/copy-dir/file.txt`, ''),
    write(`${dir}/copy-dir/sub-dir/file2.txt`, ''),
  ])
    .then(() => copy(`${dir}/copy-dir`, `${dir}/copy-dir2`))
    .then(() => {
      expect(existsSync(`${dir}/copy-dir2/file.txt`)).toBeTruthy();
      expect(existsSync(`${dir}/copy-dir2/sub-dir/file2.txt`)).toBeTruthy();
    });
});

describe('getEntries', () => {
  let entries = ['file.txt', 'file.js'];
  beforeEach(() => {
    return remove(dir).then(() =>
      Promise.all(
        entries.map((el) => {
          return write(`${dir}/${el}`, '').then(() =>
            write(`${dir}/subdir/${el}`, '')
          );
        })
      )
    );
  });

  test('list all entries recursively', () => {
    return getEntries(dir).then((result) => {
      expect(result.sort()).toEqual(
        // all files in dir with full path
        entries
          .map((el) => `${dir}/${el}`)
          // all files in subdir
          .concat(entries.map((el) => `${dir}/subdir/${el}`))
          // also include subdir itself
          .concat([dir + '/subdir'])
          .sort()
      );
    });
  });

  test('filter by function', () => {
    return getEntries(dir, (el) => el.indexOf('.js') > -1).then((result) => {
      expect(result).toEqual([dir + '/file.js', dir + '/subdir/file.js']);
    });
  });

  test('filter by regex', () => {
    return getEntries(dir, /subdir/).then((result) => {
      expect(result.sort()).toEqual(
        entries
          .map((el) => `${dir}/subdir/${el}`)
          .concat([`${dir}/subdir`])
          .sort()
      );
    });
  });

  test('filter by type: files', () => {
    return getEntries(dir, 'files').then((result) => {
      expect(result.sort()).toEqual(
        entries
          .map((el) => `${dir}/${el}`)
          .concat(entries.map((el) => `${dir}/subdir/${el}`))
          .sort()
      );
    });
  });

  test('filter by type: dirs', () => {
    getEntries(dir, 'dirs').then((result) => {
      expect(result).toEqual([dir + '/subdir']);
    });
  });

  test('depth=0', async () => {
    for (let el of entries) {
      await write(`${dir}/subdir/extra/${el}`, '');
    }

    return getEntries(dir, undefined, 0).then((result) => {
      expect(result.sort()).toEqual(
        entries
          .map((el) => `${dir}/${el}`)
          .concat([dir + '/subdir'])
          .sort()
      );
    });
  });

  test('depth=1', async () => {
    for (let el of entries) {
      await write(`${dir}/subdir/extra/${el}`, '');
    }

    return getEntries(dir, undefined, 1).then((result) => {
      expect(result.sort()).toEqual(
        entries
          .map((el) => `${dir}/${el}`)
          .concat([dir + '/subdir', dir + '/subdir/extra'])
          .concat(entries.map((el) => `${dir}/subdir/${el}`))
          .sort()
      );
    });
  });

  test('depth=2', async () => {
    for (let el of entries) {
      await write(`${dir}/subdir/extra/${el}`, '');
    }

    getEntries(dir, undefined, 2).then((result) => {
      expect(result.sort()).toEqual(
        entries
          .map((el) => `${dir}/${el}`)
          .concat([dir + '/subdir', dir + '/subdir/extra'])
          .concat(entries.map((el) => `${dir}/subdir/${el}`))
          .concat(entries.map((el) => `${dir}/subdir/extra/${el}`))
          .sort()
      );
    });
  });

  test('non existing dir', () => {
    expect.hasAssertions();
    return expect(getEntries(dir + '/non-existing')).rejects.toThrow(
      Error(`ENOENT: no such file or directory, scandir '${dir}/non-existing'`)
    );
  });
});
