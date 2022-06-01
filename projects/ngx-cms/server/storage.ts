import Storage from '@engineers/gcloud-storage';
import { storageBucket, storageRoot } from '~config/server/gcloud';
import deasync from 'deasync';
import { ReadOptions } from '@engineers/nodejs/fs-sync';
import { PathLike, WriteFileOptions } from 'node:fs';
import { objectType } from '@engineers/javascript/objects';
import { resolve } from 'node:path';

// all functions must have the same signature as @engineers/nodejs/fs.read(), write()
// todo: if path:URl remove protocol i.e: `file://`

export let storage = new Storage({
  bucket: storageBucket,
  keyFilename: resolve(
    __dirname,
    '../config/server/gcloud-service-account.json'
  ),
});

/**
 *
 * @param path
 * @param options
 */
export function read(
  path: PathLike,
  options?: ReadOptions | BufferEncoding
): Promise<Buffer | string | Array<any> | { [key: string]: any } | boolean> {
  return storage.download(`${path.toString()}`, options);
}

// export function writeFileSync(path: PathLike | number, data: string | NodeJS.ArrayBufferView, options?: WriteFileOptions): void;
/**
 *
 * @param path
 * @param data
 * @param options
 */
export function write(
  path: PathLike,
  data: any,
  options?: WriteFileOptions
): Promise<any> {
  return storage.write(
    `${path.toString()}`,
    ['array', 'object'].includes(objectType(data)) ? JSON.stringify(data) : data
  );
}

/**
 *
 * @param path
 */
export function remove(path: PathLike): Promise<any> {
  return storage.delete(`${path.toString()}`);
}

/*
// todo: convert async functions (read, write) into sync
// https://www.npmjs.com/package/deasync
// https://newbedev.com/how-to-wrap-async-function-calls-into-a-sync-function-in-node-js-or-javascript
// issue with jest https://github.com/abbr/deasync/issues/156
export function readSync(file: string): any {
  let done = false;
  let data;
  read(file).then((_data) => {
    data = _data;
    done = true;
  });
  deasync.loopWhile(() => !done);
  return data;
}
export function writeSync(): void {}

*/
