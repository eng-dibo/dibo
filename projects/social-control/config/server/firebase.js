// todo: merge with gcloud.js
const { existsSync } = require("fs");
const { resolve } = require("path");

let serviceAccount;
if (process.env.gcloud_serviceAccount) {
  serviceAccount = process.env.gcloud_serviceAccount;
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
  appId: process.env.gcloud_appId,
  apiKey: process.env.gcloud_apiKey,
  // Cloud Messaging
  messagingSenderId: process.env.gcloud_messagingSenderId,
  measurementId: process.env.gcloud_measurementId,
  authDomain: process.env.gcloud_authDomain,
  databaseURL: process.env.gcloud_databaseURL,
  // keep it blank to get from serviceAccount.projectId
  projectId: process.env.gcloud_projectId,
  // default: $projectId.appspot.com
  storageBucket: process.env.gcloud_storageBucket,
  storageRoot: process.env.gcloud_storageRoot,
};
