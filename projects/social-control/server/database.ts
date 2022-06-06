import {
  Uri,
  connect as _connect,
  query as _query,
  model,
  mongoose,
} from '@engineers/mongoose';
import { Obj } from '@engineers/javascript/objects';
import { db } from '~config/server';
import * as models from '~server/models';
import cache from '@engineers/nodejs/cache-fs';
import { Categories } from '~browser/formly-categories-material/functions';
import { timer } from '@engineers/javascript/time';
import { TEMP } from './routes';

import { Operation } from '@engineers/databases/operations';

let development = process.env.NODE_ENV === 'development';

/**
 * connect to the database using 'config'
 *
 * @function connect
 * @param  uri
 * @returns
 */
export function connect(uri?: Uri): ReturnType<typeof _connect> {
  return _connect(uri || db.config, { multiple: false });
}

/**
 * close all connections;
 *
 * @function disconnect
 * @returns [description]
 */
export function disconnect(): Promise<void> {
  // or mongoose.connection.close()
  return mongoose.disconnect();
}

/**
 *
 * @param url
 * @param uri
 */
export function query(
  url: string | Operation,
  uri?: Uri
): ReturnType<typeof _query> {
  return connect(uri).then(() =>
    _query(url, (collection: string) => getModel(collection))
  );
}

/**
 *
 */
export function insert() {}
/**
 *
 */
export function update() {}
/**
 *
 */
export function get() {}
/**
 *
 */
export function _delete() {}

/**
 * convert a plain object to a mongoose model
 *
 * @function getModel
 * @param  collection
 * @param schemaObject
 * @param  schemaObj
 * @returns
 */
export function getModel(
  collection: string,
  schemaObject?: Obj
): ReturnType<typeof model> {
  // console.log("model: " +{ type, models: mongoose.models, modelNames: mongoose.modelNames() });

  if (!schemaObject) {
    // schemaName is the same as collection name (except for [collection]_categories)
    // ex: articles_categories, jobs_categories
    let schemaName = collection.includes('_categories')
      ? 'categories'
      : collection;

    if (schemaName in models) {
      schemaObject = models[schemaName as keyof typeof models];
    }
  }

  return schemaObject
    ? model(collection, schemaObject)
    : // disable validation for non existing schemas
      model(collection, {}, { strict: false, validateBeforeSave: false });
}

/*
/**
 * get adjusted categories (i.e: adding branches, top to each entry & add main categories)
 * & adjusted articles_categories (i.e: article_categories & category_articles)
 * & inputs (for forms)
 * @method categories
 * @return {categories, main, article_categories, category_articles, inputs}
 */
/**
 *
 * @param collection
 */
export function getCategories(
  collection = 'articles'
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
          if (development) {
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
          if (development) {
            console.log(
              `[server] getCategories: adjusted ${timer('getCategories', true)}`
            );
          }
          return ctg.itemCategories(items);
        })
        .catch((error) => {
          console.error('[server] getCategories', error);
          throw new Error(`[server] getCategories, ${error.message}`);
        });
    })
  );
}
