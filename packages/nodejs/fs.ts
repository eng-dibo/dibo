/**
 * the promise version of `fs-sync`
 * refer to fs-sync for docs and functions descriptions
 */

import {
  PathLike,
  constants,
  MakeDirectoryOptions,
  WriteFileOptions,
  lstatSync,
  readdirSync,
} from 'node:fs';

import {
  unlink,
  rmdir,
  lstat,
  rename,
  writeFile,
  access,
  mkdir as _mkdir,
  readFile,
  readdir,
} from 'node:fs/promises';

import { Abortable } from 'node:events';

import { MoveOptions, resolve, ReadOptions, stripComments } from './fs-sync';
import { dirname, join } from 'node:path';
import { objectType, Obj } from '@engineers/javascript/objects';
import stripJsonComments from 'strip-json-comments';
import { copyFile } from 'fs/promises';
// todo: import { lstat } from 'fs/promises';

/**
 * get file size asynchronously
 */
export function getSize(
  path: PathLike,
  unit: 'b' | 'kb' | 'mb' | 'gb' = 'b'
): Promise<number> {
  return lstat(path)
    .then((stats: any) => stats.size)
    .then((size: any) => {
      let units = {
        b: 0,
        kb: 1,
        mb: 2,
        gb: 3,
      };

      return size / 1024 ** units[unit];
    });
}

export function isDir(path: PathLike): Promise<boolean> {
  return lstat(path).then((stats: any) => stats.isDirectory());
}

export function getModifiedTime(file: PathLike): Promise<number> {
  return lstat(file).then((stats: any) => stats.mtimeMs);
}

export function mkdir(
  path: string | string[],
  mode: number | string = 0o777
): Promise<void> {
  if (path instanceof Array) {
    return Promise.all(path.map((p) => ({ [p]: mkdir(p, mode) }))).then(
      () => {}
    );
  }

  let options: MakeDirectoryOptions = { mode, recursive: true };

  return access(path, constants.R_OK)
    .catch(() => _mkdir(path as string, options as MakeDirectoryOptions))
    .then(() => {});
}

export function move(
  path: PathLike,
  newPath: PathLike,
  options?: MoveOptions
): any {
  return rename(path, newPath);
}

/* todo: return Promise<boolean>
   todo: overlaps:
     export function remove(path: PathLike, options?: RemoveOptions): Promise<boolean>;
     export function remove(path: PathLike[], options?: RemoveOptions): Promise<{ [path: string]: any }>;
*/
/**
 * remove a file or an array of files or recursively remove a directory and its subdirectories
 * @param path
 * @param options
 * @returns
 */
export function remove(
  path: PathLike | PathLike[],
  filter?: (path: string, type: 'dir' | 'file') => boolean,
  keepDir = false
): Promise<void> {
  return recursive(
    path,
    (file, type) =>
      type === 'file' ? unlink(file) : !keepDir ? rmdir(file) : undefined,
    filter
  );
}

/**
 * copy  a file or recursively remove a directory and its subdirectories to another location
 * @param path path of the source directory
 * @destination destination of the root dir
 */
export function copy(
  path: PathLike,
  destination: string,
  filter: (file: string) => boolean = () => true
) {
  return recursive(path, (file, type) =>
    type === 'file' && filter(file)
      ? mkdir(destination).then(() =>
          copyFile(file, file.replace(path.toString(), destination))
        )
      : undefined
  );
}

export function write(
  path: PathLike,
  data: any,
  // options for fs.promises.writeFile() is same as fs.writeFileSync() + Abortable{signal:..}
  options?: WriteFileOptions & Abortable
): Promise<void> {
  path = resolve(path);
  return mkdir(dirname(path))
    .then(() =>
      ['array', 'object'].includes(objectType(data))
        ? JSON.stringify(data)
        : data
    )
    .then((dataString) => writeFile(path, dataString, options));
  // .then-> {file,data}
}

/**
 * read a file content
 * @param path
 * @param options
 * @returns a promise that resolves to:
 *   - string: if options.encoding!==undefined
 *   - Array or Object: for .json files
 *   - Buffer: otherwise
 */
export function read(
  path: PathLike,
  options?: ReadOptions | BufferEncoding
): Promise<Buffer | string | Array<any> | Obj> {
  let defaultOptions: ReadOptions = {
    encoding: null,
    flag: 'r',
    age: 0,
  };
  let opts: ReadOptions = Object.assign(
    defaultOptions,
    typeof options === 'string' ? { encoding: options } : options || {}
  );

  return getModifiedTime(path).then((modified) => {
    if (opts.age && opts.age > 0 && modified + opts.age > Date.now()) {
      throw new Error(`[fs-sync] expired file ${path}`);
    }

    return readFile(path, {
      encoding: opts.encoding,
      flag: opts.flag,
    }).then((data) => {
      // if(opts.encoding) readFile() will return string, otherwise it returns Buffer
      // if the consumer wants the data as Buffer, provide options.encoding=undefined explicitly
      // to use the default encoding provide options.encoding=null (the default behavior is)
      // https://stackoverflow.com/a/48818444/12577650
      // https://nodejs.org/api/fs.html#fs_fs_readfilesync_path_options
      if (opts.encoding === undefined) {
        return data;
      }

      data = data.toString();
      return path.toString().trim().slice(-5) === '.json'
        ? JSON.parse(stripJsonComments(data))
        : data;
    });
  });
}

// todo: getEntriesGenerator() : uses nodejs.generator or rxjs.observable
// to provide results sequentially, better for big directors
// todo: don't use `await` to prevent blocking the execution,
// i.e: execute operations in parallel
// todo: use concurrency(operation,pool=10,...args)
export async function getEntries(
  dir = '.',
  filter?: ((entry: string) => boolean) | RegExp | 'files' | 'dirs' | '*',
  depth?: number
): Promise<Array<string>> {
  let _filter: ((entry: string) => boolean) | undefined;

  if (filter === 'files') {
    _filter = (entry: string) => lstatSync(entry).isFile();
  } else if (filter === 'dirs') {
    _filter = (entry: string) => lstatSync(entry).isDirectory();
  } else if (filter === '*') {
    _filter = undefined;
  } else if (filter instanceof RegExp) {
    _filter = (entry: string) => (filter as RegExp).test(entry);
  } else if (typeof filter === 'function') {
    _filter = filter;
  }
  let entries = readdirSync(dir);
  let result: Array<string> = [];

  for (let entry of entries) {
    let path = join(dir, entry),
      fullPath = resolve(dir, entry);

    if (!_filter || (_filter as (entry: string) => boolean)(path)) {
      result.push(path);
    }

    if ((depth === undefined || depth > 0) && lstatSync(path).isDirectory()) {
      let subEntries = await getEntries(
        path,
        filter,
        depth !== undefined ? depth - 1 : undefined
      );
      result = result.concat(subEntries);
    }
  }

  // same as Promise.resolve(result) because the function in async
  return result;
}

/**
 * recursively apply a function to a directory and all subdirectories
 */
export function recursive(
  path: PathLike | PathLike[],
  apply: (path: string, type: 'dir' | 'file') => void,
  filter: (path: string, type: 'dir' | 'file') => boolean = () => true
): Promise<void> {
  if (!path) {
    return Promise.reject('path not provided');
  }

  if (path instanceof Array) {
    return Promise.all(
      // todo: path.map((p) => ({ [p]: recursive(p as string, apply) }))
      path.map((p) => recursive(p, apply, filter))
    ).then((value) => {
      /* a void return, to make it compatible with the return type */
    });
  }

  // todo: using `path` causes an issue
  // i.e: path = resolve(path);
  // https://github.com/microsoft/TypeScript/issues/44921
  // https://stackoverflow.com/questions/68283677/typescript-has-different-types-for-the-same-variable-in-the-same-scope
  // https://stackoverflow.com/questions/68240094/variable-type-inside-then-chain

  let _path = resolve(path);
  return (
    access(_path, constants.R_OK)
      .then(() => isDir(_path))
      .then((_isDir: boolean) =>
        !_isDir
          ? filter(_path, 'file')
            ? apply(_path, 'file')
            : undefined
          : filter(_path, 'dir')
          ? readdir(_path)
              .then((files: any[]) =>
                Promise.all(
                  files.map((file) => {
                    return recursive(`${_path}/${file}`, apply, filter);
                  })
                )
              )
              // execute apply on the root dir
              .then(() => Promise.resolve(apply(_path, 'dir')))
          : undefined
      )
      // if the file doesn't exist, skip
      .catch((err) => {})
      .finally(() => {
        /* void */
      })
  );

  // todo: or {file: boolean}
  // .then(() => true)
  // .catch(() => false)
}
