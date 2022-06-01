import cache, { CacheOptions } from '@engineers/cache';
import { PathLike } from 'node:fs';
import { ReadOptions, read as readSync, resolve } from './fs-sync';
import { write } from './fs';

export interface CacheFSOptions extends CacheOptions, ReadOptions {}
/**
 *
 * @param entries
 * @param options
 */
function getCache(entries: PathLike[], options: CacheOptions = {}): any {
  for (let filePath of entries) {
    try {
      // note: without {encoding: undefined} option, read() will return a string instead of Buffer
      let data = readSync(filePath, {
        ...options,
        age: (options.age || 0) * 60 * 60 * 1000,
      });

      if (data !== undefined) {
        return data;
      }
    } catch {}
  }

  throw 'no valid cache found';
}

/**
 *
 * @param entry
 * @param data
 * @param options
 */
function setCache(entry: any, data: any, options: CacheOptions = {}) {
  write(entry, data);
}

/**
 * use fileSystem as cache location for @engineers/cache
 *
 * @param files
 * @param dataSource
 * @param options
 */
export default (
  files: PathLike | PathLike[],
  dataSource: () => any,
  options?: CacheFSOptions | BufferEncoding
) => {
  let options_: CacheFSOptions = Object.assign(
    {},
    typeof options === 'string' ? { encoding: options } : options || {}
  );

  let cacheEntries: PathLike[] = (Array.isArray(files) ? files : [files]).map(
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
    options_
  );
};
