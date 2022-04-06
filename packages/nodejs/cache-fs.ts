import cache, { CacheOptions } from '@engineers/cache';
import { PathLike } from 'node:fs';
import {
  resolve,
  ReadOptions,
  read as readSync,
} from '@engineers/nodejs/fs-sync';
import { write } from '@engineers/nodejs/fs';

export interface CacheFSOptions extends CacheOptions, ReadOptions {}
function getCache(entries: PathLike[], options: CacheOptions = {}): any {
  for (let filePath of entries) {
    // note: without {encoding: undefined} option, read() will return a string instead of Buffer
    let data = readSync(filePath, {
      ...options,
      age: (options.age || 0) * 60 * 60 * 1000,
    });

    if (data !== undefined) {
      return data;
    }
  }

  throw 'no valid cache found';
}

function setCache(entry: any, data: any, options: CacheOptions = {}) {
  write(entry, data);
}

/**
 * use fileSystem as cache location for @engineers/cache
 */
export default (
  files: PathLike | PathLike[],
  dataSource: () => any,
  options?: CacheFSOptions | BufferEncoding
) => {
  let opts: CacheFSOptions = Object.assign(
    {},
    typeof options === 'string' ? { encoding: options } : options || {}
  );

  let cacheEntries: PathLike[] = (files instanceof Array ? files : [files]).map(
    (filePath) => resolve(filePath)
  );

  return cache(
    cacheEntries,
    dataSource,
    {
      get: (entries: PathLike[], options: CacheOptions = {}) =>
        getCache(entries, options),
      set: (data: any, options: CacheOptions = {}) => setCache(data, options),
    },
    opts
  );
};
