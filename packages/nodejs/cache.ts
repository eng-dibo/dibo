import { PathLike, existsSync } from 'fs';
import { isPromise, isEmpty } from '@engineers/javascript/objects';
import {
  resolve,
  getExtension,
  getModifiedTime as getModifiedTimeSync,
} from './fs-sync';
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
  age: number | [number, number] = 0
): Promise<any> {
  if (!(files instanceof Array)) {
    files = [files];
  }
  files = files.map((filePath) => resolve(filePath));

  let maxAge: number;
  if (age instanceof Array) {
    [age, maxAge] = age;
  } else {
    maxAge = 0;
  }

  /*
    //use fs.delete(files)
    if (dataSource === ":purge:")
      return Promise.all(files.map((file: string) => ({ [file]: unlink(file) })));
  */
  let data: any;
  // todo: readCache<T>
  let readCache = (filePath: PathLike): any => {
    return read(filePath);
  };

  // todo: remove filesInfo
  // contains exists files only with mtime for each file.
  let filesInfo: { [key: string]: number } = {};
  let _now = Date.now();

  for (let filePath of files) {
    if (existsSync(filePath)) {
      filesInfo[filePath as keyof typeof filesInfo] =
        getModifiedTimeSync(filePath);

      if (
        age === 0 ||
        (age > -1 &&
          filesInfo[filePath as keyof typeof filesInfo] + age * 60 * 60 * 1000 >
            _now)
      ) {
        return readCache(filePath);
      }
    }
  }

  // if there is no valid file, run dataSource()
  let file: PathLike = files[0];

  data = dataSource();

  // todo: also support rxjs.Observable
  let p: Promise<any> = isPromise(data) ? data : new Promise((r) => r(data));

  return p
    .then((_data: any) => {
      write(file, _data);
      // todo: return write()
      return _data;
    })
    .catch((error: any) => {
      if (maxAge > -1) {
        for (let k in filesInfo) {
          if (maxAge === 0 || filesInfo[k] + maxAge * 60 * 60 * 1000 > _now) {
            return readCache(k);
          }
        }
      }

      throw error;
    });
}
