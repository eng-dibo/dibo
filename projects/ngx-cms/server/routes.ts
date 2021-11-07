import { Router } from 'express';
import shortId from 'shortid';
import { connect, getModel, query } from './database';
import { prod } from '~config/server';
import { upload } from './functions';
import { getCategories } from './database';
import { write as writeFs, mkdir } from '@engineers/nodejs/fs';
import cache from '@engineers/nodejs/cache';
import { Categories } from '~browser/formly-categories-material/functions';
import { timer } from '@engineers/javascript/time';
import { resize } from '@engineers/graphics';
import { backup, restore } from '@engineers/mongoose';
import { replaceAll } from '@engineers/javascript/string';
import { slug } from '@engineers/ngx-content-core/pipes-functions';
import { resolve } from 'path';
import { parse } from '@engineers/databases/operations';
import { read, write } from './storage';

let app = Router();
const TEMP = resolve(__dirname, '../temp');

// todo: add auth token

// todo: don't import from ngx-* packages, because it may contain browser-specific APIs.

// todo: import {} from 'fs/promises' doesn't supported yet (experimental)
let { readdir, unlink } = require('fs').promises;

// todo: update collection list
// todo: get collections from db, then collections.map(el=>/*rename or remove*/), save to ./temp/supportedCollections.json
let supportedCollections = [
  'articles',
  'jobs',
  'articles_categories',
  'jobs_categories',
  'countries',
  'keywords',
  'persons',
  'languages',
];
app.get('/collections', (req: any, res: any) => res.json(supportedCollections));

/**
 * performs db operations via API.
 * todo: use AUTH_TOKEN
 * @example /api/v1/:find/articles/$articleId
 * @example /api/v1/:find/articles?params=[{"status":"approved"},null,{"limit":2}]
 */
/* app.get(/\/:([^\/]+)\/([^\/]+)(?:\/(.+))?/, (req: any, res: any) => {
  let operation = req.params[0],
    collection = req.params[1],
    // array of function params ex: find(...params)
    params = JSON.parse((req.params[2] as string) || '[]');
  if (!(params instanceof Array)) {
    params = [params as any];
  }
  timer(`get ${req.url}`);

  query(operation, collection, ...params)
    .then((data: any) => res.json(data))
    .catch((error: any) => res.json({ error }))
    .then(() => {
      if (!prod) {
        console.log('[server] get', req.url, timer(`get_${req.url}`, true));
      }
    });
}); */

/**
 * saves the article's cover image to filesystem
 */
// todo: /\/(?<type>image|cover)\/(?<id>[^\/]+)
// https://github.com/expressjs/express/issues/4277
// example: <img src="/images/articles-cover-$topicId/slug-text.png?size=250" />
// todo: change to /api/v1/articles/image/$articleId-$imageName (move to the previous app.get(); execlude from ngsw cache)
// todo:  /api/v1/$collection/image=$name-$id/slug-text?size
app.get(/\/image\/([^/-]+)-([^/-]+)-([^/]+)/, (req: any, res: any) => {
  timer('/image');

  // todo: use system.temp folder
  let collection = req.params[0],
    name = req.params[1],
    id = req.params[2],
    size = req.query.size as string,
    filePath = `${collection}/${id}/${name}.webp`,
    localPath = `${TEMP}/${collection}/item/${id}/${name}.webp`,
    resizedPath = `${localPath.replace('.webp', '')}_${size}.webp`;

  if (!id || !collection) {
    return res.json({
      error: { message: '[server/api] undefined id or collection ' },
    });
  }

  cache(
    resizedPath,
    () =>
      // use { encoding: undefined } so read() returns Buffer instead of string
      // otherwise resize(data) consider data: string as a file path
      cache(localPath, () => read(filePath, { encoding: undefined }), 24).then(
        (data: any) =>
          resize(data, size, {
            //  dest: resizedPath, //if the resized img saved to a file, data=readFile(resized)
            format:
              req.headers?.accept.indexOf('image/webp') !== -1
                ? 'webp'
                : 'jpeg',
            // todo: add this options to resize()
            // allowBiggerDim: false,
            // allowBiggerSize: false,
          })
      ),
    24
  )
    .then((data: any) => {
      // todo: set cache header
      // todo: resize with sharp, convert to webp
      // res.write VS res.send https://stackoverflow.com/a/54874227/12577650
      // res.write VS res.sendFile https://stackoverflow.com/a/44693016/12577650
      // res.writeHead VS res.setHeader https://stackoverflow.com/a/28094490/12577650
      res.writeHead(200, {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'max-age=31536000',
      });

      res.write(data);
      if (!prod) {
        console.log(
          `[server/api] get /image ${id}/${name}.webp`,
          timer('/image', true)
        );
      }
      res.end();
    })
    .catch((error: any) => res.json({ error }));
});

/*
  database operation (using operation syntax @engineers/databases/operations.parse())
  must be the last route (because it starts with a variable)

  syntax: operation:db.collection/portions?query
  examples:
   - articles -> get all articles
   - articles/:50 -> get all articles, limit=50
   - articles/123 -> get article where _id=123
   - articles/:50@category=1 -> get articles where category=1, limit=50
   - articles/:50?limit=10 -> query overrides portions

   */
app.get('*', (req: any, res: any, next: any) => {
  timer(`get ${req.url}`);
  let queryObject = parse(req.path);
  let { operation, database, collection, portions, params } = queryObject;

  /* todo:
    if (!supportedCollections.includes(collection))
      return res.json({
        error: {
          message:
            "unknown collection, use /api/v1/collections to list the allowed collections"
        }
      }); */

  // ------------------ /API route validation ------------------//

  // todo: add query to file cache ex: articles_index?filter={status:approved}
  //  -> articles_index__JSON_stringify(query)
  // for item temp=.../item/$id/data.json because this folder will also contain it's images

  let tmp = `${TEMP}/${collection}/${params.id || 'index'}.json`;

  // todo: save to cache only if(operation==='find')
  return cache(
    tmp,
    () =>
      // @ts-ignore: error TS2349: This expression is not callable.
      // Each member of the union type ... has signatures, but none of those signatures are compatible with each other.
      connect().then(() => {
        return query(queryObject);

        /*
          // todo:
          if(collection.indexOf('_categories)){
             content = getCategories(collection).then((categories: any) => {
              let ctg = new Categories(categories);

              let category = categories.categories.find(
                (el: any) => el.slug === item
              );

              let branches = [category, ...ctg.getBranches(category)];
              let items = new Set();

              categories = categories.categories
                .find((el: any) => branches.includes(el))
                .forEach((el: any) => {
                  if (el.items instanceof Array) {
                    el.items.forEach((_item: any) => items.add(_item));
                  }
                });

              findOptions.filter._id = { $in: items };
              return query(
                'find',
                collection,
                findOptions.filter,
                findOptions.docs,
                findOptions.options
              );
            });
          }
        */
      }),
    // todo: ?refresh=AUTH_TOKEN
    req.query.refresh ? -1 : 3
  )
    .then((payload: any) => {
      res.json(payload);
      if (!prod) {
        console.log(
          `[server/api] getData: +${timer(`get ${req.url}`, true)}sec`
        );
      }
    })
    .catch((error: any) => {
      res.json({ error });
      if (!prod) {
        console.error(
          '[server/api] getData:',
          timer(`get ${req.url}`, true),
          error
        );
      }
    });
});

// todo: typescript: add files[] to `req` definition
// todo: cover= only one img -> upload.single()
// todo: change to /api/v1/collection/itemType[/id]
app.post('/:collection', upload.single('cover'), (req: any, res: any) => {
  if (!prod) {
    console.log('[server/api] post', {
      body: req.body,
      files: req.files,
      file: req.file,
      cover: req.body.cover, // should be moved to files[] via multer
    });
  }

  if (!req.body || !req.body.content) {
    return res.send({ error: { message: 'no data posted' } });
  }

  let data = req.body;

  let update: boolean;
  if (!data._id) {
    data._id = shortId.generate();
    update = false;
  } else {
    update = true;
  }
  let collection = req.params.collection;

  if (['article', 'job'].includes(collection)) {
    collection += 's';
  }

  timer(`post ${req.url}`);

  let tmp = `${TEMP}/${collection}/item/${data._id}`;
  mkdir(tmp);

  // todo: replace content then return insertData()
  /*
    1- handle base46 data, then: upload images to firebase, then resize
    2- insert data to db
    3- upload cover image then resize it
     */

  let date = new Date();

  if (!data.slug || data.slug === '') {
    data.slug = slug(data.title, {
      length: 200,
      allowedChars: ':ar',
      encode: false,
    });
  } // if slug changed, cover fileName must be changed

  // todo: check permissions, for owner, admin -> auto approve
  data.status = 'approved';

  // handle base64-encoded data (async)
  data.content = data.content.replace(
    /<img src="data:image\/(.+?);base64,([^=]+)={0,2}">/g,
    (
      match: any,
      extension: any,
      imgData: any,
      matchPosition: any,
      fullString: any
    ) => {
      let fileName = date.getTime(),
        filePath = `${collection}/${data._id}/${fileName}.webp`,
        src = `api/v1/image/${collection}-${fileName}-${data._id}/${data.slug}.webp`,
        srcset = '',
        sizes = '';
      for (let i = 1; i < 10; i++) {
        srcset += `${src}?size=${i * 250} ${i * 250}w,`;
      }

      // todo: catch(err=>writeFile('queue/*',{imgData,err})) to retry uploading again
      resize(imgData, '', { format: 'webp' /*, input: 'base64' */ })
        .then((_data: any) => write(filePath, _data))
        .then(() => {
          console.log(`[server/api] uploaded: ${fileName}`);
          writeFs(`${tmp}/${fileName}.webp`, imgData);
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
    let filePath = `${collection}/${data._id}/cover.webp`;

    resize(req.file.buffer, '', { format: 'webp' })
      .then((_data: any) => write(filePath, _data))
      .then((file: any) => {
        console.log(`[server/api] cover uploaded`);
        writeFs(`${tmp}/cover.webp`, req.file.buffer);
      });
  }

  writeFs(`${tmp}/data.json`, data).catch((error: any) =>
    console.error(
      `[server/api] cannot write the temp file for: ${data._id}`,
      error
    )
  );

  // todo: data.summary=summary(data.content)

  connect()
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
              let temp = `${TEMP}/${collection}/item/${data._id}`;
              readdir(temp).then((files: any) => {
                files.forEach((file: any) => {
                  // remove images and cover sizes; cover.webp, $images.webp and data.json are already renewed.
                  if (file.indexOf('.webp') && file.indexOf('_') !== -1) {
                    unlink(`${temp}/${file}`).catch((error: any) =>
                      console.error(
                        `[server/api] cannot delete ${temp}/${file}`,
                        {
                          error,
                        }
                      )
                    );
                  }
                });
              });

              return data;
            })
        );
      }
      let content = new contentModel(data);
      return content.save();
    })
    .then((_data: any) => {
      res.send(_data);
      unlink(`${TEMP}/${collection}/index.json`);
      if (!prod) {
        console.log(
          `[server/api] post: ${collection}`,
          timer(`post ${req.url}`, true),
          _data
        );
      }
    })
    .catch((error: any) => {
      res.send({ error });
      console.error(
        `[server/api] post: ${collection}`,
        timer(`post ${req.url}`, true),
        error
      );
    });

  // the content will be available after the process completed (uploading files, inserting to db, ..)
});

// todo: /backup?filter=db1,db2:coll1,coll2,db3:!coll4
app.get('/backup', (req: any, res: any) => {
  let filter: any;
  if (req.query.filter) {
    let tmp = JSON.parse(req.query.filter as string);
    if (tmp instanceof Array) {
      filter = (db: any, coll: any) => tmp.includes(db);
    }
    // todo: else of object; else if string
  } else {
    filter = (db: any, coll: any) => {
      if (!prod) {
        console.log('[backup] filter', db, coll);
      }
      return true;
    };
  }

  connect
    // @ts-ignore: error TS2349: This expression is not callable.
    // Each member of the union type ... has signatures, but none of those signatures are compatible with each other.
    .then((con: any) => {
      let host = con.client.s.options.srvHost,
        now = replaceAll(new Date().toISOString(), ':', '-');
      console.log(`[backup] host: ${host}`);

      // using !console.log() or console.log() || true is illegal in typescript
      // don't convert void to boolean this way, use ',' (console.log(),true)
      // playground: https://www.typescriptlang.org/play?#code/GYVwdgxgLglg9mABFApgZygCgB4H4BcARnHADYoCGYAlAN4C+AsAFAssD07cA1i6hpkwQEaMigB0pOAHNM1ADRQATiBTVqbVs04olSuEr7oswsKPKSZcjc35YAhKfMSps9UYFOxlt4gA+fsgqakA
      // issue: https://github.com/microsoft/TypeScript/issues/28248#issuecomment-434693307
      return backup(con, filter).then((data: any) => {
        let file = `${process.env.INIT_CWD}/tmp/db-backup/${host}/${now}.json`;
        if (!prod) {
          console.log('[backup]', { file, data });
        }
        let result = { info: con.client.s, backup: data };

        return writeFs(file, result)
          .then(() => {
            console.log('[backup] Done');
            res.json(result);
          })
          .catch((error: any) => {
            console.error({ error });
            throw Error(`[backup] cannot write to ${file}`);
          });
      });
    })

    .catch((error: any) => res.json({ error }));
});

// todo: /restore?filter=db1;db2:coll2,coll3;db3:!coll1,coll2 & change=db2:db5
// i.e: upload db2:coll2 to db5
app.get('/restore', (req: any, res: any) => {});
/*
   cors default options:
   {
    "origin": "*",
    "methods": "GET,HEAD,PUT,PATCH,POST,DELETE",
    "preflightContinue": false,
    "optionsSuccessStatus": 204
  }
   */

/*app.use(
    formidableMiddleware({
      //  uploadDir: './data/uploads/$type',
      multiples: true,
      keepExtensions: true,
      maxFileSize: 5 * 1024 * 1024,
      maxFieldsSize: 5 * 1024 * 1024 //the amount of memory all fields together (except files)
    })
  );*/

export default app;
