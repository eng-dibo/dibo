import { test, expect, afterAll, afterEach } from '@jest/globals';
import {
  connect,
  model,
  mongoose,
  query,
  listDatabases,
  listCollections,
  backup,
  BackupData,
  restore,
  getConnection,
} from './index';
import { uri as _uri } from './test/config';
import shortId from 'shortid';

// only run tests if credentials provided

let uri = Object.assign({ host: '127.0.0.1', dbName: 'spec' }, _uri);

let booksSchema = { name: 'string', serial: 'number' },
  options = { shortId: true },
  booksModel = model('books', booksSchema, options),
  backupData: BackupData;

export { booksModel };
/**
 * drop all databases used for testing and close the connection after finishing testing
 * to avoid open handlers
 */
export function clean(): Promise<any> {
  return Promise.all(
    ['spec', 'spec2']
      .map((db) => mongoose.connection.useDb(db))
      .map((con) => {
        con.db.dropDatabase().then(() => con.close());
      })
  );
}

afterAll(() => clean());
afterEach(() => {
  // delete all documents from the collection 'books'
  // only could be deleted after connecting to the database
  if (mongoose.connection.readyState === 1) {
    return booksModel.deleteMany().exec();
  }
  return Promise.resolve();
});

test('connect -> wrong auth', () => {
  let uri2 = Object.assign({}, uri, { password: 'wrong' });
  return expect(connect(uri2)).rejects.toThrow('bad auth');
  // or: return connect(uri2).catch((err) => {expect(err.toString()).toMatch('bad auth');});
});

test('connect -> wrong host', () => {
  let uri2 = Object.assign({}, uri, { host: 'wrong.gbdqa.gcp.mongodb.net' });
  return expect(connect(uri2)).rejects.toThrow('ENOTFOUND');
});

test('connect', () => {
  return connect(uri).then((cn) => {
    expect(cn).toBeInstanceOf(mongoose.Mongoose);
  });
});

test('connect to an existing connection', () => {
  return connect(uri).then((cn) => {
    expect(cn).toBeInstanceOf(mongoose.Mongoose);
  });
});

test('model', () => {
  expect(booksModel.prototype).toBeInstanceOf(mongoose.Model);
  expect(booksModel.schema.obj).toHaveProperty('name', 'string');
  expect(booksModel.schema.obj).toHaveProperty('serial', 'number');
  expect(booksModel.schema.path('_id')).toBeInstanceOf(
    mongoose.SchemaTypes.String
  );
  expect(booksModel.schema.path('_id')).toHaveProperty(
    'defaultValue',
    shortId.generate
  );
});

test('query', () => {
  return booksModel
    .create({ name: 'book#1' }, { name: 'book#2' })
    .then(() => query('books'))
    .then((books) => {
      expect(books).toBeInstanceOf(Array);
      expect(books.length).toEqual(2);
      expect(books[0].name).toEqual('book#1');
    });
});

test('query: find()', () => {
  return booksModel
    .create({ name: 'book#1' }, { name: 'book#2' })
    .then(() =>
      query(
        // condition must be stringified and encoded
        `books/:1~name@${encodeURIComponent(
          JSON.stringify({ name: 'book#2' })
        )}`
      )
    )
    .then((books) => {
      expect(books).toBeInstanceOf(Array);
      expect(books.length).toEqual(1);
      expect(books[0].name).toEqual('book#2');
    });
});

test('listDatabases', () => {
  return listDatabases().then((dbs: any[]) => {
    // check that there is a database called 'spec'
    let db = dbs.filter((el) => el.name === 'spec');
    expect(db).toBeInstanceOf(Array);
    expect(db.length).toEqual(1);
  });
});

test('listCollections', () => {
  return listCollections('spec').then((collections: any[]) => {
    let collection = collections.filter((el) => el.name === 'books');
    expect(collection).toBeInstanceOf(Array);
    expect(collection.length).toEqual(1);
  });
});

// todo: fix & run skipped tests
test.skip('backup', () => {
  return backup().then((_backup: BackupData) => {
    let spec = _backup.spec,
      books = spec.books;

    expect(books.info.name).toEqual('books');
    expect(books.data.length).toEqual(2);
    expect(books.data[0].name).toEqual('book#1');

    // for the next text 'restore'
    backupData = _backup;
  });
});
test.skip('restore', () => {
  backupData = { spec2: backupData.spec };
  return restore(backupData)
    .then(() => listCollections('spec2'))
    .then((collections) => {
      expect(collections[0].name).toEqual('books');
    })
    .then(() =>
      query(
        'find',
        // todo: use empty schema, i.e: model('books',{},...)
        model('books', { name: 'string' }, { strict: false }, 'spec')
        /*, {} , { rawResult: true }*/
      )
    )
    .then((data: any) => {
      /*
        // for testing using empty schema
        console.log({
          data,
          el: data[0],
          name: data[0].name,
          createdAt: data[0].createdAt,
          v: data[0].__v,
        });*/
      expect(data[0].name).toEqual('book#1');
    });
});
