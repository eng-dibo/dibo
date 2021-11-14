import db from './database';
import firebaseConfig from './firebase';

export const prod = process.env.NODE_ENV === 'production';
// use auth code to perform admin operations.
export const AUTH = '';
export { db, firebaseConfig };
export * as models from './models';
