import { storage, app as _app } from 'firebase-admin';
import {
  File,
  Bucket,
  UploadResponse,
  DownloadResponse,
} from '@google-cloud/storage';
import { mkdirSync } from 'fs';
import { dirname } from 'path';

export interface StorageOptions {
  bucket?: string;
  app?: _app.App | null;
}
export interface UploadOptions {
  destination: string;
}

export interface DownloadOptions {
  destination: string;
}

/**
 * firebase storage functions, such as upload() and download()
 */
// todo: extends admin.storage
export default class Storage {
  // todo: bucket: Bucket
  public bucket: Bucket;

  /**
   * creates a new bucket
   * @method constructor
   * @param  bucket
   */
  // todo: if(bucket instanceof admin.Bucket)this.bucket=bucket
  constructor(options: StorageOptions = {}) {
    // apps[0] may be null, but storage(...) accepts app | undefined only
    this.bucket = storage(
      options.app === null ? undefined : options.app
    ).bucket(options.bucket);
  }

  /**
   * uploads a file to the current bucket
   * @method upload
   * @param  file file path or Buffer
   * @param  options UploadOptions object or destination path as string
   * @return Promise<UploadResponse>;  //UploadResponse=[File, API request]
   */
  // todo: upload / download a folder
  // todo: upload(..):File{}
  upload(
    file: string | Buffer,
    options?: UploadOptions | string
  ): Promise<UploadResponse | void> {
    if (typeof options === 'string') {
      options = { destination: options };
    }
    // convert base64 to buffer
    if (
      typeof file === 'string' &&
      /data:.+\/.+?;base64,([^=]+)={0,2}/.test(file)
    ) {
      file = Buffer.from(file.replace(/data:.+\/.+?;base64,/, ''), 'base64');
    }

    if (typeof file === 'string') {
      return this.bucket.upload(file, options);
    } else {
      return this.bucket.file(options?.destination as string).save(file);
    }
  }

  /**
   * downloads a file
   * @method download
   * @param  file        file path
   * @param  options DownloadOptions object or destination as string
   * @return Promise<DownloadResponse>
   */

  download(
    file: string | File,
    options: DownloadOptions | string = { destination: '' }
  ): Promise<DownloadResponse> {
    if (typeof file === 'string') {
      file = this.bucket.file(file);
    }
    if (typeof options === 'string') {
      options = { destination: options };
    }

    // create the destination if it doesn't exist'
    mkdirSync(dirname(options.destination), { recursive: true });
    return file.download(options);
  }

  /**
   * writes a content to a file in the bucket
   */
  write(file: any, content: string | Buffer): any {}
}
