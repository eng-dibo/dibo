import Storage from '@engineers/firebase-admin/storage';
import init from '@engineers/firebase-admin/init';
import firebaseConfig from '~config/server/firebase';
import deasync from 'deasync';
import { ReadOptions } from '@engineers/nodejs/fs-sync';
import { PathLike, WriteFileOptions } from 'fs';
import { objectType } from '@engineers/javascript/objects';

// all functions must have the same signature as @engineers/nodejs/fs.read(), write()
// todo: if(dev) use filesystem
// todo: if path:URl remove protocol i.e: `file://`

let app = init({ name: 'ngxCms', ...firebaseConfig });
let storage = new Storage({ app, bucket: firebaseConfig.storageBucket });
// the parent folder where all files saved
// todo: change to ngx-cms
let bucket = 'almogtama3.com';

export function read(
  path: PathLike,
  options?: ReadOptions | BufferEncoding
): Promise<Buffer | string | Array<any> | { [key: string]: any } | boolean> {
  return storage.download(`${bucket}/${path.toString()}`, options);
}

// export function writeFileSync(path: PathLike | number, data: string | NodeJS.ArrayBufferView, options?: WriteFileOptions): void;
export function write(
  path: PathLike,
  data: any,
  options?: WriteFileOptions
): Promise<any> {
  return storage.write(
    `${bucket}/${path.toString()}`,
    ['array', 'object'].includes(objectType(data)) ? JSON.stringify(data) : data
  );
}

export function remove(path: PathLike): Promise<any> {
  return storage.delete(`${bucket}/${path.toString()}`);
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
