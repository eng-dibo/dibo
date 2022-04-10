import {
  Storage,
  File,
  Bucket,
  UploadResponse,
  DownloadResponse,
  SaveOptions,
  StorageOptions as _StorageOptions,
} from '@google-cloud/storage';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import stripJsonComments from 'strip-json-comments';

export interface StorageOptions extends _StorageOptions {
  bucket: string;
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
 * gcloud storage functions, such as upload() and download()
 *
 * Storage: https://cloud.google.com/nodejs/docs/reference/storage/latest/storage/storage
 * Bucket: https://cloud.google.com/nodejs/docs/reference/storage/latest/storage/storage
 * File: https://cloud.google.com/nodejs/docs/reference/storage/latest/storage/file
 *
 */
export default class {
  public storage: Storage;
  public bucket: Bucket;

  /**
   * creates a new bucket
   * @method constructor
   * @param  bucket
   */
  // todo: if(bucket instanceof admin.Bucket)this.bucket=bucket
  // constructor();
  constructor(options: StorageOptions) {
    this.storage = new Storage(options);
    this.bucket = this.storage.bucket(options.bucket);
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
   * @return Promise that resolves to:
   *           - boolean: if options.destination used
   *           - Buffer: if options.encoding is undefined
   *           - Array or plain object: if the file is json
   *           - string: otherwise
   *
   */

  // todo: if(!options.destination)return th content as Promise<Buffer | ...>
  // otherwise write the content into a local destination and return boolean
  download(
    file: string | File,
    options?: DownloadOptions | string
  ): Promise<Buffer | string | Array<any> | { [key: string]: any } | boolean> {
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

    // file.download(opts) mutates opts
    return file.download({ ...opts }).then((result: [Buffer]) => {
      if (opts.destination) {
        return true;
      }
      let data: Buffer = result[0];

      // from @engineers/nodejs/fs.ts
      if (opts.encoding === undefined) {
        return data;
      }
      let dataString: string = data.toString();

      return (file as File).name.slice(-5) === '.json'
        ? JSON.parse(stripJsonComments(dataString))
        : dataString;
    });
  }

  /**
   * writes a content to a file in the bucket
   */
  write(
    path: string,
    content: string | Buffer,
    options?: SaveOptions
  ): Promise<void> {
    return this.bucket.file(path).save(content, options);
  }

  delete(path: string, options?: DeleteOptions): Promise<any> {
    // https://stackoverflow.com/a/64539948/12577650
    return this.bucket.file(path).delete(options);
    // or: return this.bucket.deleteFiles(query?: DeleteFilesOptions);
  }

  // todo: read(file:string):Buffer
  // todo: delete folder
}
