import { connect as _connect, model, mongoose, Uri } from '@engineers/mongoose';
import { Obj } from '@engineers/javascript/objects';
import { models, db } from '~config/server';
import cache from '@engineers/nodejs/cache';
import { Categories } from '~browser/formly-categories-material/functions';
import { timer } from '@engineers/javascript/time';
import { TEMP } from './functions';
import { query as _query } from '@engineers/mongoose';
import { Operation } from '@engineers/databases/operations';

let dev = process.env.NODE_ENV === 'development';

/**
 * connect to the database using 'config'
 * @method connect
 * @param  uri
 * @return
 */
export function connect(uri?: Uri): ReturnType<typeof _connect> {
  return _connect(uri || db.config, { multiple: false });
}

/**
 * close all connections;
 * @method disconnect
 * @return [description]
 */
export function disconnect(): Promise<void> {
  // or mongoose.connection.close()
  return mongoose.disconnect();
}

export function query(url: string | Operation): ReturnType<typeof _query> {
  return _query(url, (collection: string) => getModel(collection));
}

export function insert() {}
export function update() {}
export function get() {}
export function _delete() {}

/**
 * convert a plain object to a mongoose model
 * @method getModel
 * @param  collection
 * @param  schemaObj
 * @return
 */
export function getModel(
  collection: string,
  schemaObj?: Obj
): ReturnType<typeof model> {
  // console.log("model: " +{ type, models: mongoose.models, modelNames: mongoose.modelNames() });

  if (!schemaObj) {
    // schemaName is the same as collection name (except for [collection]_categories)
    // ex: articles_categories, jobs_categories
    let schemaName = collection.indexOf('_categories')
      ? 'categories'
      : collection;
    schemaObj =
      schemaName in models ? models[schemaName as keyof typeof models] : {};
  }
  return model(collection, schemaObj, { strict: false });
}

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
