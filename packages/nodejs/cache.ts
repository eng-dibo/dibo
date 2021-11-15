import { PathLike } from 'fs';
import { isPromise } from '@engineers/javascript/objects';
import { resolve } from './fs-sync';
import { read, write } from './fs';

/**
 * cache data into a file, or read the cache file if the data is fresh
 * @method cache
 * @param  files to be read from
 * @param  dataSource a function to fetch the data if no cached file is found
 * @param  age cache age in hours
 * @return Promise<data:any>;  returns a promise (because some operations executed in async mode) , use await or .then()
 *  todo:
 *  - strategy -> in case of no valid cache & failed to get data, return:
 *               - the most recent cache file
 *               - the nearest valid cache file in files[] array in order
 *  - all functions inside cache() must use the async version
 *    ex: replace mkdirSync() with mkdir().then()
 *  - cacheSync
 *
 *  notes:
 * - maxAge:  (in hours), the maximum file's age to get in case of fetching data failed
 *
 */
export default function (
  files: PathLike | PathLike[],
  dataSource: () => any,
  age: number = 0,
  maxAge: number = 0
): Promise<any> {
  let cacheFiles: PathLike[] = (files instanceof Array ? files : [files]).map(
    (filePath) => resolve(filePath)
  );

  let data: any;

  async function readCache(entries: PathLike[], age: number): Promise<any> {
    for (let filePath of entries) {
      await read(filePath, { age: age * 60 * 60 * 1000 })
        .then((result) => {
          data = result;
        })
        .catch((e) => {});

      if (data !== undefined) {
        return Promise.resolve(data);
      }
    }

    throw 'no valid cache found';
  }

  // search for a valid cache
  return readCache(cacheFiles, age)
    .catch(() => {
      // if there is no valid file, run dataSource()
      let file: PathLike = cacheFiles[0];
      data = dataSource();

      // todo: also support rxjs.Observable
      let p: Promise<any> = isPromise(data)
        ? data
        : new Promise((r) => r(data));

      return p.then((_data: any) => {
        write(file, _data);
        // todo: return write()
        return new Promise(() => _data);
      });
    })
    .catch((error: any) => {
      if (maxAge > age) {
        return readCache(cacheFiles, maxAge);
      }

      throw error;
    });
}
