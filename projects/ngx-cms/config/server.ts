// todo: encrypt all sensitive data, or use ${{env:keyName}}
// ex: password=${{env:password}}
// todo: set prod in build time, so we don't need to provide NODE_ENV in runtime

// don't use process.cwd() and process.env.INIT_CWD, use __dirname and __filename
// to use process.cwd(), consider the working directory is project's root i.e: projects/cms
// in this case the project must be started from this location (npm run start),
// starting the project from dist/*/server > node express is wrong

import db from './database';
import firebase, { BUCKET as _bucket } from './firebase';

export const prod = process.env.NODE_ENV === 'production';
const BUCKET = prod ? _bucket : 'test';

// use auth code to perform admin operations.
export const AUTH = '';
export { db, firebase, BUCKET };
export * as models from './models';
