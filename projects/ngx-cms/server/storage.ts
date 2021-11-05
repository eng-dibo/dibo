import Storage from '@engineers/firebase-admin/storage';
import init from '@engineers/firebase-admin/init';
import firebaseConfig, { BUCKET } from '~config/firebase';
import { apps } from 'firebase-admin';
import deasync from 'deasync';
import { ReadOptions } from '@engineers/nodejs/fs-sync';
import { PathLike, WriteFileOptions } from 'fs';
import { objectType } from '@engineers/javascript/objects';

init({ name: 'testApp', ...firebaseConfig });

// todo: use env:GOOGLE_APPLICATION_CREDENTIALS=Path.resolve("./firebase-$app.json")
/* if (process.env.NODE_ENV === 'test') {
  init({
    // test (and ts-node) runs from the source code directly, not from 'dist
    serviceAccount: resolve(
      __dirname,

      '../../../packages/firebase-admin/test/firebase.json'
    ),
    name: 'testApp',
  });
} else {
  init({
    serviceAccount: resolve(
      __dirname,

      '../../config/firebase.json'
    ),
    name: 'ngxCms',
  });
}*/

let storage = new Storage({ bucket: BUCKET, app: apps[0] });

// all functions must have the same signature as @engineers/nodejs/fs.read(), write()
// todo: if(dev) use filesystem
// todo: if path:URl remove protocol i.e: `file://`

export function read(
  path: PathLike,
  options?: ReadOptions | BufferEncoding
): Promise<Buffer | string | Array<any> | { [key: string]: any }> {
  return storage.download(`${BUCKET}/${path.toString()}`, options);
}

// export function writeFileSync(path: PathLike | number, data: string | NodeJS.ArrayBufferView, options?: WriteFileOptions): void;
export function write(
  path: PathLike,
  data: any,
  options?: WriteFileOptions
): Promise<any> {
  return storage.write(
    `${BUCKET}/${path.toString()}`,
    ['array', 'object'].includes(objectType(data)) ? JSON.stringify(data) : data
  );
}

export function remove(path: PathLike): Promise<any> {
  return storage.delete(`${BUCKET}/${path.toString()}`);
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
