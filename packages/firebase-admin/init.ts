import {
  initializeApp,
  ServiceAccount,
  credential,
  AppOptions,
} from 'firebase-admin';
import { Obj } from '@engineers/javascript/objects';

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
    }

    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      opts.credential = credential.applicationDefault();
    }

    // todo: throw error: no credentials provided
  }

  if (!opts.projectId && opts.serviceAccount) {
    if (typeof opts.serviceAccount === 'string') {
      opts.serviceAccount = require(opts.serviceAccount);
    }
    opts.projectId = (opts!.serviceAccount as ServiceAccount).projectId;
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

  initializeApp(opts, opts.name);
}
