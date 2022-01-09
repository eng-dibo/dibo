import { Router } from 'express';
import shortId from 'shortid';
import { connect, getModel, query } from './database';
import { prod } from '~config/server';
import { upload } from './functions';
import { write as writeFs, read as readFS, mkdir } from '@engineers/nodejs/fs';
import cache from '@engineers/nodejs/cache';
import { timer } from '@engineers/javascript/time';
import { resize } from '@engineers/graphics';
import { backup, restore } from '@engineers/mongoose';
import { replaceAll } from '@engineers/javascript/string';
import { slug } from '@engineers/ngx-content-core/pipes-functions';
import { resolve, extname } from 'path';
import { parse } from '@engineers/databases/operations';
import { read, write } from './storage';
import { existsSync, readdirSync, unlinkSync } from 'fs';
import { toRegExp } from '@engineers/javascript/regex';
// import { getCategories } from './database';
// import { Categories } from '~browser/formly-categories-material/functions';

let app = Router();
const TEMP = resolve(__dirname, '../temp');

// todo: add auth token

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
    filePath = `${collection}/${id}/${name}.webp`,
    localPath = `${TEMP}/${collection}/item/${id}/${name}.webp`;

  if (!id || !collection) {
    return res.json({
      error: { message: '[server/api] undefined id or collection ' },
    });
  }

  // use { encoding: undefined } so read() and cache() returns Buffer instead of string
  // otherwise resize(data) consider data: string as a file path
  cache(localPath, () => read(filePath, { encoding: undefined }), {
    age: 24,
    encoding: undefined,
  })
    .then((data) => {
      if (!req.query.size) {
        return data;
      }

      let size = req.query.size,
        resizedPath = `${localPath.replace('.webp', '')}_${size}.webp`;

      return cache(
        resizedPath,
        () =>
          resize(data, size, {
            format:
              req.headers?.accept.indexOf('image/webp') !== -1
                ? 'webp'
                : 'jpeg',
            // todo: add this options to resize()
            //   - allowBiggerImageDim: false,
            //   - allowBiggerFileSize: false,
          }),
        { age: 24, encoding: undefined }
      );
    })
    .then((data: any) => {
      // todo: set cache header
      // todo: resize with sharp, convert to webp
      // res.write VS res.send https://stackoverflow.com/a/54874227/12577650
      // res.write VS res.sendFile https://stackoverflow.com/a/44693016/12577650
      // res.writeHead VS res.setHeader https://stackoverflow.com/a/28094490/12577650

      res.writeHead(200, {
        'Content-Type': 'image/webp',
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

app.get(/\/config\/(.+)/, (req: any, res: any) => {
  let nativeRequire = require('@engineers/webpack/native-require');
  let filePath = resolve(__dirname, `../../config/${req.params[0]}`);
  let content = nativeRequire(filePath);
  res.json(content);

  /*
  // todo: use ES6 dynamic import(), requires node>14
  import(filePath)
    .then((content) => res.json(content))
    .catch((error) => res.json({ error, filePath }));
    */
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
      return true;
    };
  }
  connect()
    // @ts-ignore: error TS2349: This expression is not callable.
    // Each member of the union type ... has signatures, but none of those signatures are compatible with each other.
    .then((con: any) => {
      let host = con.connection.client.s.options.srvHost,
        now = replaceAll(new Date().toISOString(), ':', '-');

      return backup(con, filter).then((data: any) => {
        let path = `../temp/db-backup/${host}/${now}`,
          info = con.connection.client.s;
        return Promise.all(
          Object.keys(data)
            .map((db: string) =>
              writeFs(resolve(__dirname, `${path}/${db}.json`), data[db])
            )
            .concat([writeFs(resolve(__dirname, `${path}/__info.json`), info)])
        ).then(() => {
          console.log('[backup] Done');
          res.json({ info, data });
        });
      });
    })

    .catch((error: any) => res.json({ error }));
});

// before running this route: make any transformation (add/filter data) and drop any db if needed
app.get('/restore/:hosts?', (req: any, res: any) => {
  let hosts = req.params.hosts;
  let existingHosts = readdirSync(resolve(__dirname, `../temp/db-backup`));

  if (!hosts) {
    return res.json({
      error: `
      provide a host name or pattern (or multiple hosts), 
      example: /restore/myhost.gbdqa.gcp.mongodb.net,myho.+  

      available hosts:
      ${existingHosts.map(
        (el) => el.replace(resolve(__dirname, '../temp/db-backup'), '') + '\r\n'
      )}
      `,
    });
  }

  connect().then(() =>
    Promise.all(
      existingHosts
        .filter((host) => toRegExp(hosts.split(',')).test(host))
        .map((host) => {
          console.log(`> restoring from ${host}`);

          let hostPath = resolve(__dirname, `../temp/db-backup/${host}`);
          if (!existsSync) {
            throw `the host ${host} not existing`;
          }

          // todo: sort by name
          let backupPath = resolve(hostPath, readdirSync(hostPath)[0]);
          if (backupPath.length === 0) {
            console.warn(`no backup files for the host ${host}`);
            Promise.resolve();
          }

          return Promise.all(
            readdirSync(backupPath).map((file: string) => {
              let filePath = resolve(`${backupPath}/${file}`);
              if (extname(filePath) !== '.json') {
                return;
              }
              console.log({ backupPath });
              return (
                readFS(filePath)
                  .then((content: any) => {
                    restore({ [file.replace('.json', '')]: content });
                  })
                  // todo: move .catch() to the top-level of Promise chain
                  .catch((error) => {
                    console.log(`[restore] error in restore()`, { error });
                    throw error;
                  })
              );
            })
          );
        })
    )
      .then(() => res.json({ done: true }))
      .catch((error) => res.json({ error }))
  );
});

/*
   cors default options:
   {
    "origin": "*",
    "methods": "GET,HEAD,PUT,PATCH,POST,DELETE",
    "preflightContinue": false,
    "optionsSuccessStatus": 204
  }
 

app.use(
    formidableMiddleware({
      //  uploadDir: './data/uploads/$type',
      multiples: true,
      keepExtensions: true,
      maxFileSize: 5 * 1024 * 1024,
      maxFieldsSize: 5 * 1024 * 1024 //the amount of memory all fields together (except files)
    })
  );
*/
/**
 * database operation (using operation syntax @engineers/databases/operations.parse())
 * must be the last route (because it starts with a variable)
 *
 * syntax: operation:db.collection/portions?query
 *
 * examples:
 * - articles -> get all articles
 * - articles/:50 -> get all articles, limit=50
 * - articles/123 -> get article where _id=123
 * - articles/:50@category=1 -> get articles where category=1, limit=50
 * - articles/:50?limit=10 -> query overrides portions
 */
app.get('*', (req: any, res: any, next: any) => {
  timer(`get ${req.url}`);
  let queryObject = parse(req.path);
  let { operation, database, collection, portions, params } = queryObject;

  if (!prod) {
    console.log('[server/routes]', { queryObject });
  }

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
    { age: req.query.refresh ? -1 : 3 }
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
      if (!prod) {
        console.error(
          `[server/api] getData: ${timer('get ' + req.url, true)}`,
          { error }
        );
      } else {
        error.details.uri = '** check logs **';
      }

      res.json({ error });
    });
});

// todo: typescript: add files[] to `req` definition
// todo: cover= only one img -> upload.single()
// todo: change to /api/v1/collection/itemType[/id]
app.post('/:collection', upload.single('cover[]'), (req: any, res: any) => {
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
    collection = req.params.collection,
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
        writeFs(`${TEMP}/media/${data._id}/cover.webp`, req.file.buffer);
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
      // force remove the cached index.json
      if (existsSync(`${TEMP}/${collection}/index.json`)) {
        unlinkSync(`${TEMP}/${collection}/index.json`);
      }

      if (existsSync(`${TEMP}/index.json`)) {
        unlinkSync(`${TEMP}/index.json`);
      }

      if (!prod) {
        console.log(
          `[server/api] post: ${collection}`,
          timer(`post ${req.url}`, true),
          _data
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
});

export default app;
