import admin, { AppOptions, ServiceAccount, app } from 'firebase-admin';
const nativeRequire = require('@engineers/webpack/native-require');

// todo: InitOptions properties
export interface InitOptions extends AppOptions {
  // a service account object, or a path to serviceAccount json file
  // get your serviceAccount from: firebase console -> project settings -> serviceAccounts -> generate private key
  serviceAccount?: string | ServiceAccount;
  name?: string;
}

/**
 * initializes firebase app
 *
 * @param options { InitOptions | string}
 * @returns {App} a firebase app
 */
export default function (options: InitOptions | string): app.App {
  let opts: InitOptions = Object.assign(
    {},
    typeof options === 'string' ? { projectId: options } : options
  );

  // todo: if(typeof opts.credential==='string') -> credential.cert()
  // else if(!opts.credential) -> applicationDefault()
  if (!opts.credential) {
    if (opts.serviceAccount) {
      opts.credential = admin.credential.cert(opts.serviceAccount);
    } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      opts.credential = admin.credential.applicationDefault();
    }

    // todo: else throw error: no credentials provided
  }

  // get projectId from credentials or serviceAccount
  if (!opts.projectId && opts.serviceAccount) {
    if (typeof opts.serviceAccount === 'string') {
      // todo: dynamic require()
      // https://stackoverflow.com/a/54559637/12577650
      // https://webpack.js.org/guides/dependency-management/#require-with-expression
      opts.serviceAccount = nativeRequire(opts.serviceAccount);
    }
    opts.serviceAccount = opts.serviceAccount as ServiceAccount;
    opts.projectId =
      // @ts-ignore: 'project_id' does not exist on type 'ServiceAccount'
      opts.serviceAccount.projectId || opts.serviceAccount.project_id;
  }

  delete opts.serviceAccount;

  if (opts.projectId) {
    if (!opts.storageBucket) {
      opts.storageBucket = `${opts.projectId}.appspot.com`;
    }

    if (!opts.databaseURL) {
      opts.databaseURL = `https://${opts.projectId}.firebaseio.com`;
    }

    /*
    // todo: property 'authDomain' doesn't exist in InitOptions
    if (!('authDomain' in opts)) {
      opts.authDomain = `${opts.projectId}.firebaseapp.com`;
    }*/
  }

  if (!opts.storageBucket?.endsWith('.appspot.com')) {
    opts.storageBucket += '.appspot.com';
  }

  if (!opts.databaseURL?.endsWith('.firebaseio.com')) {
    opts.databaseURL += '.firebaseio.com';
  }

  // don't import {initializeApp} from 'firebase-admin'
  // https://github.com/firebase/firebase-admin-node/issues/593#issuecomment-908616694
  return admin.initializeApp(opts, opts.name);
}
