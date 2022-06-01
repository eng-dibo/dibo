import { isPromise } from '@engineers/javascript/objects';

export interface CacheOptions {
  // cache age in hours (default=0)
  age?: number;
  // the maximum file's age (in hours) to get in case of fetching data failed
  // if not specified, return the existing cache data without 'age' validation
  maxAge?: number;
  // wether to refresh the existing cache after dataSource run (default=true)
  refreshCache?: boolean;
}

/**
 * cache data into a file, or read the cache file if the data is fresh
 *
 * @function cache
 * @param  files to be read from
 * @param entries
 * @param  dataSource a function to fetch the data if no cached file is found
 * @param  control get & set the cache
 * @param control.get
 * @param control.set
 * @param options  for read() except that age here in hr, in addition to maxAge
 * @returns Promise<any>;
 *  todo:
 *  - strategy -> in case of no valid cache & failed to get data, return:
 *               - the most recent cache file
 *               - the nearest valid cache file in files[] array in order
 *
 * steps:
 *  - search for a valid cache from the givin files (skipped if options.age<=0)
 *  - if no valid cache found, run dataSource() to fetch the new data
 *  - if dataSource() failed, search for a valid cache that doesn't exceed maxAge
 */
export default function (
  entries: any,
  dataSource: () => any,
  control: {
    get: (entries: any[], options: CacheOptions) => any | Promise<any>;
    set: (entry: any, data: any, options: CacheOptions) => void | Promise<void>;
  },
  options?: CacheOptions
): Promise<any> {
  let opts: CacheOptions = Object.assign({}, options || {});
  let cacheEntries: any[] = Array.isArray(entries) ? entries : [entries];
  let cacheData: Promise<any>;

  // search for a valid cache (only if opts.age>0)
  // control.get() may be not promise and throw an error
  // we need to handle the thrown error inside try & catch block
  // otherwise make sure control.get() returns a promise

  try {
    cacheData =
      opts.age && opts.age < 0
        ? Promise.reject()
        : toPromise(control.get(cacheEntries, opts));
  } catch (error) {
    cacheData = Promise.reject(error);
  }

  return (
    cacheData
      // if there is no valid file, run dataSource()
      .catch((error) =>
        toPromise(dataSource()).then((_data: any) => {
          if (opts.refreshCache !== false) {
            control.set(cacheEntries[0], _data, opts);
          }
          return _data;
        })
      )
      .catch((error: any) => {
        // if dataSource() failed, search for an existing cache that doesn't exceed maxAge
        if (!opts.maxAge || opts.maxAge > (opts.age || -1)) {
          try {
            return toPromise(
              control.get(cacheEntries, { ...opts, age: opts.maxAge })
            );
          } catch {
            // if no valid cache, don't throw an error
            // the outer function will throw an error for dataSource failing
          }
        }

        throw error;
      })
  );
}

/**
 *
 * @param value
 * @returns
 */
function toPromise<T>(value: T | Promise<T>): Promise<T> {
  return isPromise(value) ? (value as Promise<T>) : Promise.resolve(value);
}
