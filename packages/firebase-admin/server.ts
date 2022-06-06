import { HttpsFunction, https } from 'firebase-functions';

/**
 * convert nodejs http server (or express.js app) into firebase cloud function
 *
 * @function
 * @param  app  nodejs http server or express server app
 * @returns
 *
 * notes:
 *  - this function can be invoked by web url:
 *    https://us-central1-<projectId>.cloudfunctions.net/<functionName>
 *    or http://localhost:4201/<projectId>/us-central1/<functionName>
 *    you can  get projectId from the file: `/.firebaserc`
 */
export default function (app: any): HttpsFunction {
  return https.onRequest(app);
}
