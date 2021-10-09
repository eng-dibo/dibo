import { connect, getModel } from './mongoose';
import {
  read as readSync,
  write as writeSync,
} from '@engineers/nodejs/fs-sync';
import cache from '@engineers/nodejs/cache';
import Storage from '@engineers/firebase-admin/storage';
import { initializeApp } from 'firebase-admin';
import multer from 'multer';
import { Categories } from '~browser/formly-categories-material/functions';
import { timer } from '@engineers/javascript/time';
import { BUCKET } from '~config/firebase';
import { resolve } from 'path';
import init from '../../../packages/firebase-admin/init';
import { apps } from 'firebase-admin';

export let dev = process.env.NODE_ENV === 'development';

// todo: use env:GOOGLE_APPLICATION_CREDENTIALS=Path.resolve("./firebase-$app.json")
init({
  serviceAccount: resolve(
    __dirname,
    '../../../packages/firebase-admin/test/firebase.json'
  ),
  name: 'ngxCms',
});

export let bucket = new Storage({ bucket: BUCKET, app: apps[0] });

// relative to /dist/$project/core/server
const TEMP = resolve(__dirname, '..');

/*
/**
 * get adjusted categories (i.e: adding branches, top to each entry & add main categories)
 * & adjusted articles_categories (i.e: article_categories & category_articles)
 * & inputs (for forms)
 * @method categories
 * @return {categories, main, article_categories, category_articles, inputs}
 */
export function getCategories(
  collection: string = 'articles'
): ReturnType<typeof cache> {
  return cache(`${TEMP}/${collection}/categories.json`, () =>
    connect().then(() => {
      timer('getCategories');
      return Promise.all([
        getModel(`${collection}_categories`).find({}).lean(),
        // get all topics categories
        getModel(collection).find({}, 'categories').lean(),
      ])
        .then(([categories, items]) => {
          if (dev) {
            console.log(
              `[server] getCategories: fetched from server +${timer(
                'getCategories'
              )}`
            );
          }

          // don't close the connection after every query
          // todo: close the connection when the server restarts or shutdown
          // https://hashnode.com/post/do-we-need-to-close-mongoose-connection-cjetx0dxh003hcws2l1fs81nl
          // mongoose.connection.close(() => { if (dev){ console.log("connection closed");} });

          let ctg = new Categories(categories);
          ctg.adjust();
          if (dev) {
            console.log(
              `[server] getCategories: adjusted ${timer('getCategories', true)}`
            );
          }
          return ctg.itemCategories(items);
        })
        .catch((err) => {
          console.error('[server] getCategories', err);
          throw new Error(`[server] getCategories, ${err.message}`);
        });
    })
  );
}

export let json = {
  read(type: string, id?: string | number): any {
    try {
      let path = `${TEMP}/${type}/${id ? id + '/data' : 'index'}.json`;
      return readSync(path);
    } catch (err) {
      console.warn(`json.read (${type},${id}) failed`, err);
    }
  },

  write(type: string, data: any): void {
    let dir = `${TEMP}/${type}`;
    let path =
      data instanceof Array
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
  fileFilter(req: any, file: any, cb: any): void {
    // we only upload 'cover image', so only images are available
    // other files are pasted into quill editor as base64-encoded data.
    let result = file.mimetype.startsWith('image/');
    if (dev) {
      console.log('multer fileFilter', { result, req, file, cb });
    }
    // to reject this file cb(null,false) or cb(new error(..))
    cb(null, result);
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
