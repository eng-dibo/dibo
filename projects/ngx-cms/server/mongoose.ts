import { connect as _connect, model, mongoose, Uri } from '@engineers/mongoose';
import { Obj } from '@engineers/javascript/objects';
import { models, db } from '~config/server';

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
