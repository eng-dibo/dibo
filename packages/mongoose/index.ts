import mongoose from 'mongoose';
import shortId from 'shortid';
import { Obj, chunk } from '@engineers/javascript/objects';
import { replaceAll, stringToObject } from '@engineers/javascript/string';
import { Operation, parse } from '@engineers/databases/operations';
import { Admin } from 'mongodb';

// to use the native Mongo driver: connection.getClient()
// to access admin operations: mongoose.mongo.Admin(mongoose.connection.db)

export type Uri =
  | string
  | {
      username: string;
      password: string;
      // for string, separate hosts via `,`
      // | { [host: string]: number }[]; -> {host: ip}
      host?: string | string[];
      srv?: boolean;
      // the default database to be connected once the connection succeeded.
      dbName?: string;
      retryWrites?: boolean;
    };

export interface ConnectionOptions extends mongoose.ConnectOptions {
  // if false, don't create a new connection if there is another connection already open
  multiple?: boolean;
}

/**
 * connect to the database
 *
 * @param uri
 * @param options
 * @returns the connection object
 */
export function connect(
  uri: Uri,
  options: ConnectionOptions = {}
): Promise<typeof mongoose> {
  // todo: if connected to the same uri.host and uri.username
  if (!options.multiple && mongoose.connection.readyState > 0) {
    // logger.log('[mongoose] already connected');
    // mongoose.connect() resolves to mongoose
    return Promise.resolve(mongoose);
  }
  delete options.multiple;

  let defaultOptions: ConnectionOptions = {
    autoIndex: false,
    // https://mongoosejs.com/docs/connections.html
    bufferCommands: false,
    keepAlive: true,
    //  writeConcern: { w: 'majority' },
  };
  let options_ = Object.assign(options || {}, defaultOptions);

  let srv = false;
  if (typeof uri !== 'string') {
    srv = !!uri.srv;
    if (!uri.host) {
      uri.host = 'localhost:27017';
    } else if (Array.isArray(uri.host)) {
      uri.host = uri.host.join(',');
    }

    uri = `${encode(uri.username)}:${encode(uri.password)}@${uri.host}/${
      uri.dbName
    }?retryWrites=${uri.retryWrites !== false}`;
  }

  if (uri.slice(0, 7) !== 'mongodb') {
    uri = 'mongodb' + (srv ? '+srv' : '') + '://' + uri;
  }

  return mongoose.connect(uri, options_).catch((error: any) => {
    error.details = { options: options_, uri };
    throw error;
  });
}

/**
 * encodes the username and password for URI
 *
 * @param value
 * @returns
 */
export function encode(value: string): string {
  // example: convert '@' to '%40%
  // the character `%` must be encoded too
  return encodeURIComponent(value); //.replace(/%/g, '%25');
}

export type Connection =
  // a database name
  | string
  // mongoose.Mongoose is the same as typeof mongoose
  | mongoose.Mongoose
  | mongoose.Connection;

/**
 * provide one of:
 * - a database name as string to be used
 * - mongoose interface
 * - a connection object
 * to get a connection object
 *
 * @param connection a database name, or a mongoose object, or a connection object
 * @returns
 */
export function getConnection(
  connection: Connection = mongoose.connection
): mongoose.Connection {
  if (typeof connection === 'string') {
    connection = mongoose.connection.useDb(connection);
    // eslint-disable-next-line no-empty
  } else if (!(connection instanceof mongoose.Connection)) {
    connection = mongoose.connection;
  }
  return connection;
}

export interface SchemaOptions extends mongoose.SchemaOptions {
  // replaces _id with shortid, as a primary key
  shortId?: boolean;
  // if the model already exists in the provided connection,
  // remove it and create a new one with the provided schema
  override?: boolean;
}
/**
 * create a mongoose model by collection name
 * if a model with the provided connection and collection already exists,
 * it just returns the existing model.
 * to get the schema use model().schema
 *
 * @param collection collection name
 * @param schema a mongoose schema or the model fields as a plain object
 * @param options
 * @param connection a mongoose connection for a ready connected database,
 * or a database name to be connected with, this will create a new connection.models{} object
 * or the `mongoose` object
 *
 * every mongoose connection has its own connection.models{}
 * to use the same connection.models{} provide a `connection` instead of a database name as a string
 * this also help reusing models instead of creating a new one each time
 * @returns a mongoose model
 */
export function model(
  collection: string,
  // todo: | Es6 class https://mongoosejs.com/docs/guide.html#es6-classes
  schema: mongoose.Schema | Obj = {},
  options: SchemaOptions = {},
  // example: db = mongoose.connection.useDb('dbName')
  connection?: Connection
): mongoose.Model<any> {
  connection = getConnection(connection);

  if (connection.models[collection]) {
    if (options.override) {
      // todo: connection.models is Readonly
      // delete connection.models[collection];
    } else {
      return connection.models[collection];
    }
  }

  let options_ = Object.assign(
    {},
    {
      collection,
      override: false,
      // add createdAt, updatedAt
      // https://mongoosejs.com/docs/guide.html#timestamps
      timestamps: true,
    },
    options
  );

  if (!(schema instanceof mongoose.Schema)) {
    schema = new mongoose.Schema(schema, options_);
  }

  if (options_.shortId) {
    schema.add({ _id: { type: String, default: shortId.generate } });
  }

  return connection.model(collection, schema as mongoose.Schema);
}

/**
 * perform database operations dynamically via an API call request.
 * to use another database pass model(...,dbName) to the param `collection`
 *
 * @function query
 * @param  operation  operation name, example: find
 * @param  collection  collection name or model object (as accepted in @engineers/mongoose model())
 * @param url
 * @param schema
 * @param  params  every operation has it's own params, for example find(filter, docs, options)
 * @returns {}
 * @example: GET /api/v1/find/articles
 * @example: GET /api/v1/find/articles/$articleId
 * @example: GET /api/v1/find/articles/{"status":"approved"},null,{"limit":1}
 */
export function query(
  url: string | Operation,
  schema?:
    | mongoose.Model<any>
    | mongoose.Schema
    | Obj
    | ((collection: string) => mongoose.Model<any> | mongoose.Schema | Obj)
): /*mongoose.Query<any[], any> |*/ Promise<any> {
  if (typeof url === 'string') {
    url = parse(url);
  }
  let { operation = 'find', database, collection, portions, params } = url;

  // consumer doesn't have to extract the collection from the url
  if (typeof schema === 'function') {
    // @ts-ignore
    schema = schema(collection);
  }

  let contentModel: mongoose.Model<any> =
    schema && schema instanceof mongoose.Model
      ? (schema as mongoose.Model<any>)
      : model(collection, schema);

  // change the primary key for mongodb (should be implemented by the function consumer)
  if (params && params.id && !params._id) {
    params._id = params.id;
    delete params.id;
  }

  // operation aliases
  if (operation === 'insert') {
    // todo: operation= data instanceof Array? insertMany: create
    operation = 'create';
  } else if (operation === 'delete' && !params?._id) {
    // remove is deprecated, use deleteOne, deleteMany
    operation = 'remove';
  }

  if (params && params._id) {
    if (operation === 'find') {
      operation = 'findById';
    } else if (['update', 'delete', 'replace'].includes(operation)) {
      operation += 'One';
    }
  }

  let arguments_: Array<any>;
  if (operation === 'find' && params) {
    // Model.find(filter, projection, options)
    params.filter = stringToObject(params.filter);
    if (params.fields) {
      try {
        params.fields = stringToObject(params.fields);
      } catch {
        // example: collection/~field1,-_id (exclude _id)
        params.fields = replaceAll(params.fields, ',', ' ');
      }
    }

    // example: collection/?sort=field:1,field:-1
    // example: collection/?sort={field1:1, _id:-1}
    params.sort = stringToObject(params.sort, ',', ':');

    arguments_ = [params.filter, params.fields, params];
    delete params.filter;
    delete params.fields;
  } else if (operation === 'findById' && params) {
    arguments_ = [params._id];
  } else {
    // example: `update:users/_id=1,username=newUserName/upsert=true
    // UserModel.update({_id:1, username: newUserName}, {upsert: true})

    // todo: args for other operations
    // https://mongoosejs.com/docs/api/model.html
    // also methods other than Model methods such as mongoose.prototype.connect()
    // example: query('connect:mongodb://uri')
    arguments_ = (portions || []).map((element) => {
      try {
        return stringToObject(element);
      } catch {
        return element;
      }
    });
  }

  // example: contentModel.find(...params)
  // todo: some mongodb function have multiple parameters
  let mongooseQuery: mongoose.Query<any[], any> =
    // @ts-ignore: This expression is not callable.
    // because not all keys of contentModel are methods
    // ~fix:  (contentModel[..] as contentModel.method )()
    contentModel[operation as keyof typeof contentModel](...arguments_);

  // mongooseQuery.exec() converts mongoose.Query to promise
  // but doesn't work with some operations like 'create'
  // to get the result as a plain object use .lean()
  // query(..).then(data=>data.lean())
  return Promise.resolve(mongooseQuery);
}

/**
 * get Admin access to mongodb, for example to add/remove users or listDatabases()
 * connect to 'admin', i.e connect('mongodb://user:pass@host/admin').then(connection=>admin(connection))
 * https://mongodb.github.io/node-mongodb-native/api-generated/admin.html
 * https://stackoverflow.com/a/61398301/12577650
 *
 * @param connection
 * @returns
 */
// todo: test this function
export function admin(connection: Connection = mongoose.connection): Admin {
  return getConnection(connection).db.admin();
}

/**
 * List the existing databases, needs admin access.
 *
 * @param connection see getConnection()
 * @param systemDbs true to include system databases in the result, i.e: 'admin', 'local'
 * @returns an array of the available databases.
 */
export function listDatabases(connection?: Connection, systemDbs = false): any {
  return (
    admin(connection)
      // todo: listDatabases() parameters
      // https://docs.mongodb.com/manual/reference/command/listDatabases/
      .listDatabases()
      .then((_dbs: any) =>
        systemDbs
          ? _dbs.databases
          : _dbs.databases.filter(
              (database: any) => !['admin', 'local'].includes(database.name)
            )
      )
  );
}

/**
 * list all collection information for the used db
 * to change the use database, provide it's name as a string instead of `connection`
 * https://docs.mongodb.com/manual/reference/command/listCollections/#dbcmd.listCollections
 * https://mongodb.github.io/node-mongodb-native/3.6/api/Db.html#listCollections
 *
 * @param connection
 * @param filter Query to filter collections by,
 * example: to include the collection 'outlets' only: `{name: 'outlets'}`
 * example: to exclude the collection 'outlets': `{name: {$ne: 'outlets'}}`
 * @param options
 * @returns array of collections
 */
export function listCollections(
  connection?: Connection,
  filter?: Obj,
  options?: Obj
): Promise<any[]> {
  return getConnection(connection)
    .db.listCollections(filter, options)
    .toArray();
}

export type BackupFilter = (database?: string, collection?: string) => boolean;

export interface BackupData {
  [db: string]: {
    [collection: string]: {
      info: Obj;
      data: Obj[];
      // the model object, ex: {NAME: 'string', serial: 'number'}
      // to be added by the consumer before restoring the database
      model?: Obj;
      modelOptions?: Obj;
    };
  };
}

/**
 * create a full backup of the databases and their contents.
 * you need to establish a connection before calling this method
 * i.e: connect().then(()=>backup(..))
 *
 * @function backup
 * @param  connection see getConnection()
 * @param  filter  a filter strategy for databases/collections/fields to be fetched
 * @returns    { dbName: { collectionName:{ data } }}
 */
export function backup(
  connection?: Connection,
  filter: BackupFilter = () => true
): Promise<BackupData> {
  // convert [{ k1:v1, k2:v2 }] to { k1:v1, k2:v2 }
  // i.e: { [dbName]: value }
  let convert: any = (array: any) =>
    Object.fromEntries(
      array.map((item: any) => [
        Object.keys(item)[0],
        item[Object.keys(item)[0]],
      ])
    );

  return listDatabases(connection).then((dbs: any[]) =>
    Promise.all(
      dbs
        .filter((database: any) => filter(database.name))
        .map(async (database: any) => ({
          [database.name]: await listCollections(database.name).then(
            (collections: any) =>
              Promise.all(
                collections
                  .filter((collection: any) =>
                    filter(database.name, collection.name)
                  )
                  .map(async (collection: any) => ({
                    [collection.name]: {
                      info: collection,
                      data: await getConnection(database.name)
                        .collection(collection.name)
                        .find({})
                        .toArray(),
                    },
                  }))
              ).then((result: any) => convert(result))
          ),
        }))
    ).then((result: any) => convert(result))
  );
}

/**
 * restore databases from a backup created by this backup() function
 * this function doesn't use mongoose model and doesn't validate backupData,
 * you have to validate the backupData before restoring it.
 *
 * before performing the restore process:
 *  - adjust the backup data, for example: filter any unwanted database or collection
 *  - you may need to drop the database or collections
 *  - validate the data model
 * you need to establish a connection before calling this method
 * i.e: connect().then(()=>backup(..))
 *
 * @function restore
 * @param filter
 * @param chunkSize
 * @param  backupData
 * @returns void
 */
export function restore(
  backupData: BackupData,
  filter: BackupFilter = () => true,
  chunkSize = 50
): Promise<void> {
  // convert backupData format to [ { dbName, collName, ...collection } ] to use Promise.all()
  //todo: return Promise.all(Object.keys(backupData).map(...))
  // todo: return promise<{dbName:report}>
  let backupDataArray: Array<Obj> = [];
  Object.keys(backupData)
    .filter((databaseName: string) => filter(databaseName))
    .forEach((databaseName: string) => {
      Object.keys(backupData[databaseName])
        .filter((collectionName: string) =>
          filter(databaseName, collectionName)
        )
        .forEach((collectionName: string) => {
          backupDataArray.push({
            dbName: databaseName,
            collectionName,
            ...backupData[databaseName][collectionName],
          });
        });
    });

  // insert all backupData then fulfil the promise
  // todo: use info to create indexes (if collection doesn't exist)
  return Promise.all(
    backupDataArray.map(
      ({
        dbName,
        collectionName,
        data,
        info,
        model: modelObject,
        modelOptions,
      }) => {
        let dataModel = model(
          collectionName,
          // todo: mongoose casts _id from string to ObjectId which may changes its value
          // https://github.com/Automattic/mongoose/issues/11136
          modelObject || { _id: 'string' },
          Object.assign(
            { strict: false, validateBeforeSave: false },
            modelOptions || {}
          ),
          getConnection(dbName)
        );

        let dataChunk = chunk(data, chunkSize || data.length);
        // wait until all parts inserted then fulfil the promise
        return Promise.all(
          dataChunk.map((part: Array<any>, index: number) =>
            dataModel
              .insertMany(part, { lean: true, rawResult: true })
              .then(() =>
                console.log(
                  `[backup] inserted: ${dbName}/${collectionName}: part ${
                    index + 1
                  }/${dataChunk.length} `
                )
              )
              .catch((error: any) => {
                throw new Error(
                  `error in ${dbName}/${collectionName}: ${error}`
                );
              })
          )
        ).then(() => {
          /* convert Array<void> from promise.all() to void */
        });
      }
    )
  ).then(() => {
    /*void*/
  });
}

export { default as mongoose } from 'mongoose';
