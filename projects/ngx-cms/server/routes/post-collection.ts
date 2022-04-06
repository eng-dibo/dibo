// todo: typescript: add files[] to `req` definition
// todo: cover= only one img -> upload.single()

import { resize } from '@engineers/graphics';
import { timer } from '@engineers/javascript/time';
import { slug } from '@engineers/ngx-content-core/pipes-functions';
import { prod } from '~config/server';
import { supportedCollections } from './supported-collections';
import { write } from '~server/storage';
import { write as writeFs, remove } from '@engineers/nodejs/fs';
import { connect, getModel, query } from '~server/database';
import cache from '@engineers/nodejs/cache-fs';
import { existsSync, unlink } from 'node:fs';
import shortId from 'shortid';
import { TEMP } from '.';
import { Request, Response } from 'express';

// todo: change to /api/v1/collection/itemType[/id]
export default (req: Request, res: Response): any => {
  let collection = req.params.collection;
  if (!supportedCollections.includes(collection)) {
    return res.json({
      error: `posting to the collection "${collection}" in not allowed`,
    });
  }
  timer(`post ${req.url}`);
  if (!prod) {
    console.log('[server/api] post', {
      body: req.body,
      files: req.files,
      file: req.file,
    });
  }

  if (!req.body || !req.body.content) {
    return res.json({ error: { message: 'no data posted' } });
  }

  let data = req.body,
    date = new Date(),
    update: boolean;

  if (!data._id) {
    data._id = shortId.generate();
    update = false;
  } else {
    update = true;
  }

  // todo: replace content then return insertData()
  /*
      1- handle base46 data, then: upload images to firebase, then resize
      2- insert data to db
      3- upload cover image then resize it
       */

  let titleSlug = slug(data.title, {
    length: 200,
    allowedChars: ':ar',
    encode: false,
  });

  // todo: check permissions, for owner, admin -> auto approve
  data.status = 'approved';

  // handle base64-encoded data (async)
  // todo: handle other file types (i.e non-images)
  // todo: Browser part to handle srcset and sizes -> content.textContent.replace(/<img src="\/(.+)"/, '<img data-srcset="" sizes="">')
  data.content = data.content.replace(
    /<img src="(data:image\/(.+?);base64,[^=]+={0,2})".+?>/g,
    (
      match: any,
      imgData: any,
      fileType: any,
      matchPosition: any,
      fullString: any
    ) => {
      let fileName = date.getTime(),
        fileStoragePath = `${collection}/${data._id}/${fileName}.webp`,
        src = `/api/v1/image/${collection}-${fileName}-${data._id}/${titleSlug}.webp`,
        srcset = '',
        // in list layout (i.e the index page) only cover image is displayed
        // content images are displayed only on item layout
        sizes = '100vw';

      for (let i = 1; i < 10; i++) {
        let n = i * 250;
        srcset += `${src}?size=${n} ${n}w, `;
      }

      // todo: catch(err=>writeFile('queue/*',{imgData,err})) to retry uploading again
      resize(imgData, '', { format: 'webp' /*, input: 'base64' */ })
        .then((img: any) => {
          write(fileStoragePath, img);
          return img;
        })
        .then((img: any) => {
          writeFs(`${TEMP}/media/${data._id}/${fileName}.webp`, img);
          console.log(`[server/api] uploaded: ${fileName}`);
        })
        .catch((error) => {
          console.error('imgData', { error, imgData });
          throw new Error(`error in handling the encoded images ${error}`);
        });
      // todo: get image dimensions from dataImg
      return `<img width="" height="" data-src="${src}" data-srcset="${srcset}" sizes="${sizes}" alt="${data.title}" />`;
    }
  );

  // upload cover
  if (req.file && req.file.buffer) {
    if (!prod) {
      console.log('[server/api] uploading cover ...');
    }
    data.cover = true;

    // to get original name: cover.originalname
    let fileStoragePath = `${collection}/${data._id}/cover.webp`;

    resize(req.file.buffer, '', { format: 'webp' })
      .then((_data: any) => write(fileStoragePath, _data))
      .then((file: any) => {
        console.log(`[server/api] cover uploaded`);
        writeFs(`${TEMP}/media/${data._id}/cover.webp`, req.file!.buffer);
      });
  }

  connect()
    .then(() =>
      cache(`${TEMP}/articles_categories/index.json`, () =>
        query('/articles_categories')
      ).then((categories) => {
        if (!data.categories || data.categories.length === 0) {
          // default category: general topics
          data.categories = ['dPdoPD6UEp'];
        } else {
          // add parents recursively

          if (typeof data.categories === 'string') {
            // Angular httpClient.post() converts arrays with one element into string
            data.categories = [data.categories];
          }
          // convert to {_id:parent}
          let tmp: any = {},
            getParentRecursive = (entry: string) => {
              if (tmp[entry]) {
                data.categories.push(tmp[entry]);
                getParentRecursive(tmp[entry]);
              }
            };
          categories.forEach((el: any) => {
            tmp[el._id] = el.parent;
          });

          data.categories.forEach((el: string) => getParentRecursive(el));
        }

        // filter the first category in data.categories[] that has no parent
        let mainCategory = categories.filter((el: any) => {
          return !el.parent && data.categories.includes(el._id);
        })[0];

        data.slug = `${slug(mainCategory.title, {
          length: 200,
          allowedChars: ':ar',
          encode: false,
        })}/${titleSlug}`;
      })
    )
    // @ts-ignore: error TS2349: This expression is not callable.
    // Each member of the union type ... has signatures, but none of those signatures are compatible with each other.
    .then(() => {
      let contentModel = getModel(collection);
      if (update) {
        return (
          contentModel
            .replaceOne({ _id: data._id }, data, {
              upsert: true,
              timestamps: true,
            })
            // return data to the front-End
            .then((doc: any) => {
              return data;
            })
        );
      }
      let content = new contentModel(data);
      return content.save();
    })
    .then((_data: any) => {
      res.json(_data);
      // purge the cache
      function purge(path: string): void {
        if (existsSync(`${TEMP}/${path}`)) {
          unlink(`${TEMP}/${path}`, () => {});
        }
      }

      // todo: also purge the rendered .html file from cache (collection/category/slug-~id.html)
      // also index files, such as $collection/0:10**
      purge(`${collection}/${_data._id}.json`);
      purge(`${collection}/${_data._id}.html`);
      purge(`${collection}/index.html`);
      remove(`${TEMP}/${collection}/images/${_data._id}`);

      if (!prod) {
        console.log(
          `[server/api] post: ${collection}`,
          timer(`post ${req.url}`, true)
        );
      }
    })
    .catch((error: any) => {
      res.json({ error });
      console.error(
        `[server/api] post: ${collection}`,
        timer(`post ${req.url}`, true),
        error
      );
    });

  // we don't need to wait until writeFs to be finished to insert data to the db
  writeFs(`${TEMP}/${collection}/${data._id}.json`, data).catch((error: any) =>
    console.error(
      `[server/api] cannot write the temp file for: ${data._id}`,
      error
    )
  );

  // the content will be available after the process completed (uploading files, inserting to db, ..)
};
