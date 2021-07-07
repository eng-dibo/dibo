/**
 * the promise version of `fs-sync`
 * refer to fs-sync for docs and functions descriptions
 */

import {
  promises as fsp,
  PathLike,
  constants,
  MakeDirectoryOptions,
  WriteFileOptions,
  Abortable,
} from 'fs';
import {
  MoveOptions,
  RemoveOptions,
  resolve,
  ReadOptions,
  stripComments,
} from './fs-sync';
import { dirname } from 'path';
import { objectType, Obj } from '@engineers/javascript/objects';
import stripJsonComments from 'strip-json-comments';
// todo: import { lstat } from 'fs/promises';

/**
 * get file size asynchronously
 */
export function getSize(
  path: PathLike,
  unit: 'b' | 'kb' | 'mb' | 'gb' = 'b'
): Promise<number> {
  return fsp
    .lstat(path)
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
  return fsp.lstat(path).then((stats: any) => stats.isDirectory());
}

export function getModifiedTime(file: PathLike): Promise<number> {
  return fsp.lstat(file).then((stats: any) => stats.mtimeMs);
}

export function mkdir(
  path: string | string[],
  mode: number | string = 0o777
): Promise<void> {
  if (path instanceof Array) {
    return Promise.all(
      path.map((p) => ({ [p]: mkdir(p, mode) }))
    ).then(() => {});
  }

  let options: MakeDirectoryOptions = { mode, recursive: true };

  return fsp
    .access(path, constants.R_OK)
    .catch(() => fsp.mkdir(path as string, options as MakeDirectoryOptions))
    .then(() => {});
}

export function move(
  path: PathLike,
  newPath: PathLike,
  options?: MoveOptions
): any {
  return fsp.rename(path, newPath);
}

/* todo: return Promise<boolean>
   todo: overlaps:
     export function remove(path: PathLike, options?: RemoveOptions): Promise<boolean>;
     export function remove(path: PathLike[], options?: RemoveOptions): Promise<{ [path: string]: any }>;
*/
export function remove(
  path: PathLike | PathLike[],
  options: RemoveOptions = {}
): Promise<void> {
  if (!path) {
    return Promise.reject('path not provided');
  }

  if (path instanceof Array) {
    return Promise.all(
      // todo: path.map((p) => ({ [p]: remove(p as string, options) }))
      path.map((p) => remove(p, options))
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
  let opts = Object.assign({}, { keepDir: false }, options);

  return (
    fsp
      .access(_path, constants.R_OK)
      .then(() => isDir(_path))
      .then((_isDir: boolean) =>
        !_isDir
          ? fsp.unlink(_path)
          : fsp
              .readdir(_path)
              .then((files: any[]) =>
                Promise.all(
                  files.map((file) => {
                    return remove(`${_path}/${file}`, opts);
                  })
                )
              )
              .then(() =>
                !opts.keepDir ? fsp.rmdir(_path) : Promise.resolve()
              )
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
    .then((dataString) => fsp.writeFile(path, dataString, options));
  // .then-> {file,data}
}

export function read(
  path: PathLike,
  options?: ReadOptions | BufferEncoding
): Promise<string | Array<any> | Obj> {
  if (typeof options === 'string') {
    options = { encoding: options } as ReadOptions;
  }

  let defaultOptions: ReadOptions = {
    mode: 'txt',
    encoding: null,
    flag: 'r',
  };
  let opts: ReadOptions = Object.assign({}, defaultOptions, options);

  return fsp
    .readFile(path, {
      encoding: opts.encoding,
      flag: opts.flag,
    })
    .then((data) => (opts.mode === 'buffer' ? data : data.toString()))
    .then((data) =>
      opts.mode === 'json' || path.toString().trim().slice(-5) === '.json'
        ? JSON.parse(stripJsonComments(data as string))
        : data
    );
}
