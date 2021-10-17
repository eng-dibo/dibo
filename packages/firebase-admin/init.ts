import admin, {
  // initializeApp,
  ServiceAccount,
  credential,
  AppOptions,
} from 'firebase-admin';

// todo: InitOptions properties
export interface InitOptions extends AppOptions {
  // a service account object, or a path to serviceAccount json file
  // get your serviceAccount from: firebase console -> project settings -> serviceAccount ->
  serviceAccount?: string | ServiceAccount;
  name?: string;
}

/**
 * initializes firebase app
 * @param options
 */
export default function (options: InitOptions | string): void {
  let opts: InitOptions = Object.assign(
    {},
    typeof options === 'string' ? { projectId: options } : options
  );

  if (!opts.credential) {
    if (opts.serviceAccount) {
      opts.credential = credential.cert(opts.serviceAccount);
    } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      opts.credential = credential.applicationDefault();
    }

    // todo: else throw error: no credentials provided
  }

  // get projectId from credentials or serviceAccount
  if (!opts.projectId) {
    // @ts-ignore: projectId' does not exist on type 'Credential'
    if (opts.credential!.projectId) {
      // @ts-ignore
      opts.projectId = opts.credential.projectId;
    } else if (opts.serviceAccount) {
      if (typeof opts.serviceAccount === 'string') {
        opts.serviceAccount = require(opts.serviceAccount);
      }
      console.log({ xx: opts.serviceAccount });
      opts.serviceAccount = opts.serviceAccount as ServiceAccount;
      opts.projectId =
        // @ts-ignore: 'project_id' does not exist on type 'ServiceAccount'
        opts.serviceAccount.projectId || opts.serviceAccount.project_id;
    }
  }

  delete opts.serviceAccount;

  if (opts.projectId) {
    if (!('storageBucket' in opts)) {
      opts.storageBucket = `gs://${opts.projectId}.appspot.com`;
    }

    if (!('databaseURL' in opts)) {
      opts.databaseURL = `https://${opts.projectId}.firebaseio.com`;
    }

    /*
    // todo: property 'authDomain' doesn't exist in InitOptions
    if (!('authDomain' in opts)) {
      opts.authDomain = `${opts.projectId}.firebaseapp.com`;
    }*/
  }

  // don't import {initializeApp} from 'firebase-admin'
  // https://github.com/firebase/firebase-admin-node/issues/593#issuecomment-908616694
  admin.initializeApp(opts, opts.name);
}
