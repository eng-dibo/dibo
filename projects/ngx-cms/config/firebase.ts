import { existsSync } from 'fs';
import { resolve } from 'path';

let serviceAccount: string;
if (process.env.firebase_serviceAccount) {
  serviceAccount = process.env.firebase_serviceAccount;
  // don't use `firebase.json` because import 'config/firebase' will import it instead of firebase.ts
} else if (existsSync(resolve(__dirname, './firebase-service-account.json'))) {
  // todo: or use env:GOOGLE_APPLICATION_CREDENTIALS=Path.resolve("./firebase-$app.json")
  serviceAccount = resolve(__dirname, './firebase-service-account.json');
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
  storageBucket: process.env.firebase_storageBucket,
};
