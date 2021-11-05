import { existsSync } from 'fs';
import { resolve } from 'path';

let serviceAccount: string;
if (process.env.firebase_serviceAccount) {
  serviceAccount = process.env.firebase_serviceAccount;
} else if (existsSync(resolve(__dirname, './firebase.json'))) {
  serviceAccount = resolve(__dirname, './firebase.json');
} else {
  serviceAccount = resolve(
    __dirname,
    '../../../packages/firebase-admin/test/firebase.json'
  );
}

export default {
  // path to firebase.json
  // get serviceAccount from firebase -> project settings -> service accounts -> generate
  serviceAccount,
  appId: process.env.firebase_appId,
  apiKey: process.env.firebase_apiKey,
  // Cloud Messaging
  messagingSenderId: process.env.firebase_messagingSenderId,
  measurementId: process.env.firebase_measurementId,
  authDomain: process.env.firebase_authDomain,
  databaseURL: process.env.firebase_databaseURL,
  projectId: process.env.firebase_projectId,
  // todo: using 'storageBucket' cases:
  // The project to be billed is associated with an absent billing account
  // storageBucket: process.env.firebase_storageBucket || 'test',
};

// bucket name for gcloud storage
// todo: use config.storageBucket
export const BUCKET =
  (process.env.NODE_ENV === 'production'
    ? process.env.firebase_storageBucket || 'test'
    : 'test') + '/ngx-cms';
