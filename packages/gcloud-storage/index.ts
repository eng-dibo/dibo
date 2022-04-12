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
  private rootPath: string;

  /**
   * creates a new bucket
   * @method constructor
   * @param  bucket
   */
  // todo: if(bucket instanceof admin.Bucket)this.bucket=bucket
  // constructor();
  constructor(options: StorageOptions) {
    this.storage = new Storage(options);

    if (options.bucket.includes('/')) {
      let parts = options.bucket.split('/');
      options.bucket = parts.shift() as string;
      this.rootPath = parts.join('/');
    }
    if (!options.bucket.endsWith('.appspot.com')) {
      options.bucket += '.appspot.com';
    }
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
    let opts: UploadOptions = Object.assign(
      {} as any,
      typeof options === 'string' ? { destination: options } : options || {}
    );

    if (this.rootPath && options?.destination) {
      opts.destination = `${this.rootPath}/${opts.destination}`;
    }
    return this.bucket.upload(file, opts);
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
      file = this.bucket.file(
        this.rootPath ? `${this.rootPath}/${file}` : file
      );
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
   * download all files from a directory that match the provided filter
   * @param destination the local path to download the files to
   * @param dir the directory to be downloaded
   * @param filter
   * @param options limit the downloaded files (paginating behavior)
   * @returns
   */
  downloadAll(
    destination: string,
    dir?: string,
    filter?: RegExp | ((file: string) => boolean),
    options = { start: 0, end: undefined }
  ) {
    let results: { [key: string]: boolean } = {};
    if (!filter) {
      filter = (file) => true;
    } else if (filter instanceof RegExp) {
      filter = (file) => (filter as RegExp).test(file);
    }
    return this.bucket
      .getFiles({ prefix: dir })
      .then((files) => files[0].filter((file) => (filter as any)(file.name)))
      .then((files) =>
        Promise.all(
          files.slice(options.start, options.end).map((file: File) =>
            this.download(file, {
              destination: `${destination}/${file.name}`,
            }).then((result) => {
              results[file.name] = result as boolean;
            })
          )
        ).then(() => results)
      );
  }

  /**
   * writes a content to a file in the bucket
   */
  write(
    path: string,
    content: string | Buffer,
    options?: SaveOptions
  ): Promise<void> {
    if (this.rootPath) {
      path = `${this.rootPath}/${path}`;
    }
    return this.bucket.file(path).save(content, options);
  }

  // https://stackoverflow.com/a/64539948/12577650
  delete(path: string, options?: DeleteOptions): Promise<any> {
    if (this.rootPath) {
      path += `/${this.rootPath}`;
    }
    return this.bucket.file(path).delete(options);
    // or: return this.bucket.deleteFiles(query?: DeleteFilesOptions);
  }

  // todo: read(file:string):Buffer
  // todo: delete folder
}
