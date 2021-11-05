import { storage, app as _app } from 'firebase-admin';

// todo: use 'firebase/storage'
import {
  File,
  Bucket,
  UploadResponse,
  DownloadResponse,
} from '@google-cloud/storage';
import { mkdirSync } from 'fs';
import { dirname } from 'path';
import stripJsonComments from 'strip-json-comments';

export interface StorageOptions {
  bucket?: string;
  app?: _app.App | null;
}
export interface UploadOptions {
  destination: string;
}

export interface DownloadOptions {
  destination?: string;
  encoding?: BufferEncoding | null;
}

// import { DeleteOptions } from '@google-cloud/service-object';
export interface DeleteOptions {
  ignoreNotFound?: boolean;
}

/**
 * firebase storage functions, such as upload() and download()
 */
// todo: extends Bucket
// super(storage: Storage, name: string, options?: BucketOptions);
export default class Storage {
  // todo: bucket: Bucket
  public bucket: Bucket;

  /**
   * creates a new bucket
   * @method constructor
   * @param  bucket
   */
  // todo: if(bucket instanceof admin.Bucket)this.bucket=bucket
  // constructor();
  constructor(options: StorageOptions = {}) {
    this.bucket = storage(
      // apps[0] may be null, but storage(...) accepts app | undefined only
      options.app === null ? undefined : options.app
      // todo: using a custom bucket name causes error:
      // The project to be billed is associated with an absent billing account.
      // or: The specified bucket does not exist
      // or: Not Found
    ).bucket(/*options.bucket*/);
  }

  /**
   * uploads a file to the current bucket
   * @method upload
   * @param  file file path
   * @param  options UploadOptions object or destination path as string
   * @return Promise<UploadResponse>;  //UploadResponse=[File, API request]
   */
  // todo: upload / download a folder
  upload(
    file: string,
    options?: UploadOptions | string
  ): Promise<UploadResponse | void> {
    if (typeof options === 'string') {
      options = { destination: options };
    }
    return this.bucket.upload(file, options);
  }

  /**
   * downloads a file
   * @method download
   * @param  file        file path
   * @param  options DownloadOptions object or destination as string
   * @return Promise<DownloadResponse>
   */

  // todo: if(!options.destination)return th content as Promise<Buffer | ...>
  // otherwise write the content into a local destination and return boolean
  download(
    file: string | File,
    options?: DownloadOptions | string
  ): Promise<Buffer | string | Array<any> | { [key: string]: any }> {
    if (typeof file === 'string') {
      file = this.bucket.file(file);
    }

    let defaultOptions = {
      encoding: null,
    };
    let opts: DownloadOptions = Object.assign(
      defaultOptions,
      typeof options === 'string' ? { destination: options } : options || {}
    );

    // create the destination if it doesn't exist'
    if (opts.destination) {
      mkdirSync(dirname(opts.destination), { recursive: true });
    }

    // @ts-ignore
    return file.download(opts).then((result: [Buffer]) => {
      let data: Buffer = result[0];

      // from @engineers/nodejs/fs.ts
      if (opts.encoding === undefined) {
        return data;
      }
      let dataString: string = data.toString();
      return file.toString().trim().slice(-5) === '.json'
        ? JSON.parse(stripJsonComments(dataString))
        : dataString;
    });
  }

  /**
   * writes a content to a file in the bucket
   */
  write(path: string, content: string | Buffer): Promise<void> {
    return this.bucket.file(path).save(content);
  }

  delete(path: string, options?: DeleteOptions): Promise<any> {
    // https://stackoverflow.com/a/64539948/12577650
    return this.bucket.file(path).delete(options);
    // or: return this.bucket.deleteFiles(query?: DeleteFilesOptions);
  }

  // todo: read(file:string):Buffer
  // todo: delete folder
}
