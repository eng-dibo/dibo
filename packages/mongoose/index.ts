import mongoose from 'mongoose';
import shortId from 'shortid';
import { Obj, chunk } from '@engineers/javascript/objects';
import { parse } from '@engineers/databases/operations';
import { Admin } from 'mongodb';

// to use the native Mongo driver: connection.getClient()
// to access admin operations: mongoose.mongo.Admin(mongoose.connection.db)

export { mongoose };

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
    // https://mongoosejs.com/docs/connections.html
    bufferCommands: false,
    autoIndex: false,
    keepAlive: true,
    //  writeConcern: { w: 'majority' },
  };
  let opts = Object.assign(options || {}, defaultOptions);

  let srv = false;
  if (typeof uri !== 'string') {
    srv = !!uri.srv;
    if (!uri.host) {
      uri.host = 'localhost:27017';
    } else if (uri.host instanceof Array) {
      uri.host = uri.host.join(',');
    }

    uri = `${encode(uri.username)}:${encode(uri.password)}@${uri.host}/${
      uri.dbName
    }?retryWrites=${uri.retryWrites !== false}`;
  }

  if (uri.substr(0, 7) !== 'mongodb') {
    uri = 'mongodb' + (srv ? '+srv' : '') + '://' + uri;
  }

  return mongoose.connect(uri, opts).catch((error: any) => {
    error.details = { uri, options: opts };
    throw error;
  });
}

/**
 * encodes the username and password for URI
 */
export function encode(value: string): string {
  return encodeURIComponent(value); // .replace(/%/g, "%25");
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
 * @param connection a database name, or a mongoose object, or a connection object
 */
export function getConnection(
  connection: Connection = mongoose.connection
): mongoose.Connection {
  if (typeof connection === 'string') {
    connection = mongoose.connection.useDb(connection);
  } else if (connection instanceof mongoose.Connection) {
    connection = connection;
  } else {
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
      delete connection.models[collection];
    } else {
      return connection.models[collection];
    }
  }

  let opts = Object.assign(
    {},
    {
      override: false,
      collection,
      // add createdAt, updatedAt
      // https://mongoosejs.com/docs/guide.html#timestamps
      timestamps: true,
    },
    options
  );

  if (!(schema instanceof mongoose.Schema)) {
    schema = new mongoose.Schema(schema, opts);
  }

  if (opts.shortId) {
    schema.add({ _id: { type: String, default: shortId.generate } });
  }

  return (connection as mongoose.Connection).model(
    collection,
    schema as mongoose.Schema
  );
}

/**
 * perform database operations dynamically via an API call request.
 * to use another database pass model(...,dbName) to the param `collection`
 * @method query
 * @param  operation  operation name, example: find
 * @param  collection  collection name or model object (as accepted in @engineers/mongoose model())
 * @param  params  every operation has it's own params, for example find(filter, docs, options)
 * @return {}
 * @example: GET /api/v1/find/articles
 * @example: GET /api/v1/find/articles/$articleId
 * @example: GET /api/v1/find/articles/{"status":"approved"},null,{"limit":1}
 */
export function query(
  url: string,
  schema?: mongoose.Model<any> | mongoose.Schema | Obj
): /*mongoose.Query<any[], any> |*/ Promise<any> {
  let { operation, database, collection, portions, query: _query } = parse(url);

  let contentModel: mongoose.Model<any> =
    schema && schema instanceof mongoose.Model
      ? (schema as mongoose.Model<any>)
      : model(collection, schema);

  if (_query && _query.id) {
    if (operation === 'find') {
      operation = 'findById';
    } else if (['update', 'delete', 'replace'].includes(operation)) {
      operation += 'One';
    }
  }

  // example: contentModel.find(...params)
  // todo: some mongodb function have multiple parameters
  let mongooseQuery: mongoose.Query<any[], any> =
    // @ts-ignore: This expression is not callable.
    // because not all keys of contentModel are methods
    // ~fix:  (contentModel[..] as contentModel.method )()
    contentModel[operation as keyof typeof contentModel](_query);

  // .exec() converts mongoose.Query to promise
  // todo: return mongooseQuery[lean ? 'lean' : 'exec']();
  return mongooseQuery.exec();
}

/**
 * get Admin access to mongodb, for example to add/remove users or listDatabases()
 * connect to 'admin', i.e connect('mongodb://user:pass@host/admin').then(connection=>admin(connection))
 * https://mongodb.github.io/node-mongodb-native/api-generated/admin.html
 * https://stackoverflow.com/a/61398301/12577650
 * @param connection
 * @returns
 */
// todo: test this function
export function admin(
  connection: Connection = mongoose.connection
): any /*Admin*/ {
  return new mongoose.mongo.Admin();
  // return new mongoose.mongo.Admin(connection.db);
  // return getConnection(connection).db.admin();
}

/**
 * List the existing databases, needs admin access.
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
              (db: any) => !['admin', 'local'].includes(db.name)
            )
      )
  );
}

/**
 * list all collection information for the used db
 * to change the use database, provide it's name as a string instead of `connection`
 * https://docs.mongodb.com/manual/reference/command/listCollections/#dbcmd.listCollections
 * https://mongodb.github.io/node-mongodb-native/3.6/api/Db.html#listCollections
 * @param connection
 * @param filter Query to filter collections by,
 * example: to include the collection 'outlets' only: `{name: 'outlets'}`
 * example: to execlude the collection 'outlets': `{name: {$ne: 'outlets'}}`
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

export type BackupFilter = (db?: string, collection?: string) => boolean;

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
 * @method backup
 * @param  connection see getConnection()
 * @param  filter  a filter strategy for databases/collections/fields to be fetched
 * @return    { dbName: { collectionName:{ data } }}
 */
export function backup(
  connection?: Connection,
  filter: BackupFilter = () => true
): Promise<BackupData> {
  // convert [{ k1:v1, k2:v2 }] to { k1:v1, k2:v2 }
  // i.e: { [dbName]: value }
  let convert: any = (arr: any) =>
    arr.reduce(
      (obj: any, item: any) => ({
        ...obj,
        [Object.keys(item)[0]]: item[Object.keys(item)[0]],
      }),
      {}
    );

  return listDatabases(connection).then((dbs: any[]) =>
    Promise.all(
      dbs
        .filter((db: any) => filter(db.name))
        .map(async (db: any) => ({
          [db.name]: await listCollections(db.name).then((collections: any) =>
            Promise.all(
              collections
                .filter((collection: any) => filter(db.name, collection.name))
                .map(async (collection: any) => ({
                  [collection.name]: {
                    info: collection,
                    data: await getConnection(db.name)
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
 * you have to validate the backupData before restoring it
 * @method restore
 * @param  backupData
 * @return void
 *
 * notes:
 * - to insert the data into another database just modify backupData and rename dbName.
 *   example:
 *       data.backup.newDbName = data.backup.oldDbName
 *       delete data.backup.oldDbName
 *   todo: return promise<{dbName:report}>
 */
export function restore(
  backupData: BackupData,
  chunkSize: number = 50
): Promise<void> {
  // todo: return Promise.all(...insertMany(data))

  // convert backupData format to [ { dbName, collName, ...collection } ]
  let backupDataArray: Array<Obj> = [];
  Object.keys(backupData).forEach((dbName: string) => {
    Object.keys(backupData[dbName]).forEach((collectionName: string) => {
      let collection = backupData[dbName][collectionName];
      let { data, info } = collection;
      backupDataArray.push({
        dbName,
        collectionName,
        data,
        info,
      });
    });
  });

  // insert all backupData then fulfil the promise
  return Promise.all(
    backupDataArray.map((el) => {
      let { dbName, collectionName, data, info } = el;

      let dataModel = model(
        collectionName,
        {},
        { strict: false, validateBeforeSave: false },
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
                }/${data.length} `
              )
            )
            .catch((err: any) => {
              throw new Error(`error in ${dbName}/${collectionName}: ${err}`);
            })
        )
      ).then(() => {
        /* convert Array<void> from promise.all() to void */
      });
    })
  ).then(() => {
    /*void*/
  });
}
