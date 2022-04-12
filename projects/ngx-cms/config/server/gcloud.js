const { existsSync } = require("fs");
const { resolve } = require("path");

let serviceAccount;
// if no serviceAccount provided, gcloud will use the path env.GOOGLE_APPLICATION_CREDENTIALS
// https://cloud.google.com/docs/authentication/getting-started
if (process.env.gcloud_serviceAccount) {
  serviceAccount = process.env.gcloud_serviceAccount;
} else if (existsSync(resolve(__dirname, "./gcloud-service-account.json"))) {
  serviceAccount = resolve(__dirname, "./gcloud-service-account.json");
}

let projectId = process.env.gcloud_projectId || "ngx-cms";
module.exports.serviceAccount = serviceAccount;
module.exports.projectId = projectId;
// todo: issue: tsc will not emit declarations without `|| undefined`
// run `npx -p typescript tsc config/**/*.js --declaration --allowJs --emitDeclarationOnly --esModuleInterop`
module.exports.apiKey = process.env.gcloud_apiKey || undefined;
module.exports.measurementId = process.env.gcloud_measurementId || undefined;
//format: $bucketName.appspot.com/root/path
module.exports.storageBucket =
  process.env.gcloud_storageBucket || `${projectId}.appspot.com`;
module.exports.databaseURL =
  process.env.gcloud_databaseURL || `https://${projectId}.firebaseio.com`;
module.exports.cloudRun = {
  name:
    process.env.gcloud_cloudRun_name || process.env.gcloud_cloudRun_image
      ? process.env.gcloud_cloudRun_image.replace(/\./, "-")
      : "ngx-cms",
  platform: process.env.gcloud_cloudRun_platform || "managed",
  region: process.env.gcloud_cloudRun_region || "europe-west1",
  allowUnauthenticated: true,
  image: process.env.gcloud_cloudRun_image,
};

module.exports.gcloudMessaging = {
  // firebase cloud messages VS in-app messages
  // https://stackoverflow.com/a/66399812/12577650
  id: process.env.gcloud_messagingSenderId,
  subject:
    process.env.gcloud_messagingSubject || "mailto:example@yourdomain.org",
};
