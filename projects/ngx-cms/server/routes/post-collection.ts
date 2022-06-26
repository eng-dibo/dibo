// todo: typescript: add files[] to `req` definition
// todo: cover= only one img -> upload.single()

// import { resize } from '@engineers/graphics';
import { timer } from '@engineers/javascript/time';
import { slug } from '@engineers/ngx-content-core/pipes-functions';
import { prod } from '~config/server';
import { supportedCollections } from './supported-collections';
import { write } from '~server/storage';
import { remove, write as writeFs } from '@engineers/nodejs/fs';
import { connect, getModel, query } from '~server/database';
import cache from '@engineers/nodejs/cache-fs';
import { existsSync, unlink } from 'node:fs';
import shortId from 'shortid';
import { TEMP } from '.';
import { Request, Response } from 'express';

/**
 *
 * @param img
 * @param {...any} args
 */

/**
 *
 * @param img
 * @param {...any} args
 */
function resize(img: any, ...args: any[]) {
  return Promise.resolve(img);
}

// todo: change to /api/v1/collection/itemType[/id]
export default (request: Request, res: Response): any => {
  let collection = request.params.collection;
  if (!supportedCollections.includes(collection)) {
    return res.json({
      error: `posting to the collection "${collection}" in not allowed`,
    });
  }
  timer(`post ${request.url}`);
  if (!prod) {
    console.log('[server/api] post', {
      body: request.body,
      files: request.files,
      file: request.file,
    });
  }

  if (!request.body || !request.body.content) {
    return res.json({ error: { message: 'no data posted' } });
  }

  let data = request.body,
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
      1- handle base46 data, then: upload images to gcloud storage, then resize
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
        source = `/api/v1/image/${collection}-${fileName}-${data._id}/${titleSlug}.webp`,
        srcset = '',
        // in list layout (i.e the index page) only cover image is displayed
        // content images are displayed only on item layout
        sizes = '100vw';

      for (let index = 1; index < 10; index++) {
        let n = index * 250;
        srcset += `${source}?size=${n} ${n}w, `;
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
      return `<img width="" height="" data-src="${source}" data-srcset="${srcset}" sizes="${sizes}" alt="${data.title}" />`;
    }
  );

  // upload cover
  if (request.file && request.file.buffer) {
    if (!prod) {
      console.log('[server/api] uploading cover ...');
    }
    data.cover = true;

    // to get original name: cover.originalname
    let fileStoragePath = `${collection}/${data._id}/cover.webp`;

    resize(request.file.buffer, '', { format: 'webp' })
      .then((_data: any) => write(fileStoragePath, _data))
      .then((file: any) => {
        console.log(`[server/api] cover uploaded`);
        writeFs(`${TEMP}/media/${data._id}/cover.webp`, request.file!.buffer);
      });
  }

  connect()
    .then(() =>
      cache(`${TEMP}/articles_categories/index.json`, () =>
        query('/articles_categories')
      ).then((categories) => {
        if (!data.categories || data.categories.length === 0) {
          // default category: general topics
          // todo: get default category from config or leave it blank
          data.categories = ['dPdoPD6UEp'];
        } else {
          // add parents recursively

          if (typeof data.categories === 'string') {
            // Angular httpClient.post() converts arrays with one element into string
            data.categories = [data.categories];
          }
          // convert to {_id:parent}
          let temporary: any = {},
            getParentRecursive = (entry: string) => {
              if (temporary[entry]) {
                data.categories.push(temporary[entry]);
                getParentRecursive(temporary[entry]);
              }
            };
          categories.payload.forEach((element: any) => {
            temporary[element._id] = element.parent;
          });

          data.categories.forEach((element: string) =>
            getParentRecursive(element)
          );
        }

        // filter the first category in data.categories[] that has no parent
        let mainCategory = categories.payload.find((element: any) => {
          return !element.parent && data.categories.includes(element._id);
        });

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
            .then((document_: any) => {
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
      /**
       *
       * @param path
       */
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
          timer(`post ${request.url}`, true)
        );
      }
    })
    .catch((error: any) => {
      res.json({ error });
      console.error(
        `[server/api] post: ${collection}`,
        timer(`post ${request.url}`, true),
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
