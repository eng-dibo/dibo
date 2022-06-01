import {
  read as readSync,
  write as writeSync,
} from '@engineers/nodejs/fs-sync';

import multer from 'multer';
import { resolve } from 'node:path';

export let dev = process.env.NODE_ENV === 'development';

// relative to /dist/$project/server
export const TEMP = resolve(__dirname, '..');

export let json = {
  read(type: string, id?: string | number): any {
    try {
      let path = `${TEMP}/${type}/${id ? id + '/data' : 'index'}.json`;
      return readSync(path);
    } catch (error) {
      console.warn(`json.read (${type},${id}) failed`, error);
    }
  },

  write(type: string, data: any): void {
    let dir = `${TEMP}/${type}`;
    let path = Array.isArray(data)
      ? `${dir}/index.json`
      : `${dir}/${data._id}/data.json`;
    writeSync(path, data);
  },
};

// multer handles multipart/form-data ONLY, make sure to add enctype="multipart/form-data" to <form>
// todo: add multer to specific urls: app.post(url,multer,(req,res)=>{})
// todo: if(error)res.json(error)
// todo: fn upload(options){return merge(options,defaultOptions)}
export let upload = multer({
  limits: {
    fileSize: 5 * 1024 * 1024,
    // form total size; formData[content] contains some images (base64 encoded)
    fieldSize: 10 * 1024 * 1024,
    files: 20,
  },
  fileFilter(request: any, file: any, callback: any): void {
    // we only upload 'cover image', so only images are available
    // other files are pasted into quill editor as base64-encoded data.
    let result = file.mimetype.startsWith('image/');
    if (dev) {
      console.log('multer fileFilter', {
        result,
        req: request,
        file,
        cb: callback,
      });
    }
    // to reject this file cb(null,false) or cb(new error(..))
    callback(null, result);
  },
  // multer uses memoryStorage by default
  // diskStorage saves the uploaded file to the default temp dir,
  // but rename(c:/oldPath, d:/newPath) not allowed,
  // so we upload the file to a temporary dir inside the same partition
  // https://stackoverflow.com/a/43206506/12577650
  storage: multer.memoryStorage(),
  /*multer.diskStorage({
    destination: function(req, file, cb) {
      let dir = `${TEMP}/uploads`;
      mkdir(dir);
      cb(null, dir);
    },
    filename: function(req, file, cb) {
      cb(null, `tmp${new Date().getTime()}.tmp`);
    }
  }) */
});
