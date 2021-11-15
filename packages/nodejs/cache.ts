import { PathLike } from 'fs';
import { isPromise } from '@engineers/javascript/objects';
import { resolve, ReadOptions } from './fs-sync';
import { read, write } from './fs';

export interface CacheOptions extends ReadOptions {
  // the maximum file's age (in hours) to get in case of fetching data failed
  maxAge?: number;
}

/**
 * cache data into a file, or read the cache file if the data is fresh
 * @method cache
 * @param  files to be read from
 * @param  dataSource a function to fetch the data if no cached file is found
 * @param options  for read() except that age here in hr, in addition to maxAge
 * @return Promise<any>;
 *  todo:
 *  - strategy -> in case of no valid cache & failed to get data, return:
 *               - the most recent cache file
 *               - the nearest valid cache file in files[] array in order
 *  - cacheSync
 *
 */
export default function (
  files: PathLike | PathLike[],
  dataSource: () => any,
  // read() options
  options?: CacheOptions | BufferEncoding
): Promise<any> {
  let opts: CacheOptions = Object.assign(
    {},
    typeof options === 'string' ? { encoding: options } : options || {}
  );
  let cacheFiles: PathLike[] = (files instanceof Array ? files : [files]).map(
    (filePath) => resolve(filePath)
  );

  let data: any;

  async function readCache(entries: PathLike[], age: number = 0): Promise<any> {
    for (let filePath of entries) {
      // note: without {encoding: undefined} option, read() will return a string instead of Buffer
      await read(filePath, { ...opts, age: age * 60 * 60 * 1000 })
        .then((result) => {
          data = result;
        })
        .catch((e) => {});

      if (data !== undefined) {
        return data;
      }
    }

    throw 'no valid cache found';
  }

  // search for a valid cache
  return readCache(cacheFiles, opts.age)
    .catch(() => {
      // if there is no valid file, run dataSource()
      let file: PathLike = cacheFiles[0];
      data = dataSource();

      // todo: also support rxjs.Observable
      let p: Promise<any> = isPromise(data) ? data : Promise.resolve(data);

      return p.then((_data: any) => {
        write(file, _data);
        // todo: return write()
        return _data;
      });
    })
    .catch((error: any) => {
      if (opts.age && opts.maxAge && opts.maxAge > opts.age) {
        return readCache(cacheFiles, opts.maxAge);
      }

      throw error;
    });
}
