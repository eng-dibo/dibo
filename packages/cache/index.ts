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
 * @method cache
 * @param  files to be read from
 * @param  dataSource a function to fetch the data if no cached file is found
 * @param  control get & set the cache
 * @param options  for read() except that age here in hr, in addition to maxAge
 * @return Promise<any>;
 *  todo:
 *  - strategy -> in case of no valid cache & failed to get data, return:
 *               - the most recent cache file
 *               - the nearest valid cache file in files[] array in order
 *
 * steps:
 *  - search for a valid cache from the givin files (skipped if options.age<=0)
 *  - if no valid cache found, run dataSource() to fetch the new data
 *  - if dataSource() failed, search for a valid cache that doesn't exceed maxAge
 *
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
  let cacheEntries: any[] = entries instanceof Array ? entries : [entries];

  let data: any;

  // search for a valid cache (only if opts.age>0)
  return (
    opts.age && opts.age > 0
      ? control.get(cacheEntries, opts)
      : Promise.reject()
  )
    .catch(() => {
      // if there is no valid file, run dataSource()
      let entry = cacheEntries[0];
      data = dataSource();

      return (isPromise(data) ? data : Promise.resolve(data)).then(
        (_data: any) => {
          if (opts.refreshCache !== false) {
            control.set(entry, _data, opts);
          }
          return _data;
        }
      );
    })
    .catch((error: any) => {
      if (!opts.maxAge || opts.maxAge > (opts.age || -1)) {
        return control.get(cacheEntries, { ...opts, age: opts.maxAge });
      }

      throw error;
    });
}
