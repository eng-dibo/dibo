const { existsSync } = require("fs");
const { resolve } = require("path");

let serviceAccount;
if (process.env.firebase_serviceAccount) {
  serviceAccount = process.env.firebase_serviceAccount;
  // don't use `firebase.json` because import 'config/firebase' will import it instead of firebase.ts
} else if (existsSync(resolve(__dirname, "./gcloud-service-account.json"))) {
  // todo: or use env:GOOGLE_APPLICATION_CREDENTIALS=Path.resolve("./gcloud-$app.json")
  serviceAccount = resolve(__dirname, "./gcloud-service-account.json");
} else {
  serviceAccount = resolve(
    __dirname,
    "../../../packages/firebase-admin/test/firebase.json"
  );
}

// only serviceAccount path is required,
// default: gcloud-service-account.json
module.exports = {
  // path to the serviceAccount.json file
  // use serviceAccount to login
  // get serviceAccount from gcloud (or firebase) console
  // firebase -> project settings -> service accounts -> generate
  serviceAccount,
  appId: process.env.firebase_appId,
  apiKey: process.env.firebase_apiKey,
  // Cloud Messaging
  messagingSenderId: process.env.firebase_messagingSenderId,
  measurementId: process.env.firebase_measurementId,
  authDomain: process.env.firebase_authDomain,
  databaseURL: process.env.firebase_databaseURL,
  // keep it blank to get from serviceAccount.projectId
  projectId: process.env.firebase_projectId,
  // default: $projectId.appspot.com
  storageBucket: process.env.firebase_storageBucket,
};
