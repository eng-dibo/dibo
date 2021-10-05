import { prod } from './server';
import { Uri } from '@engineers/mongoose';

interface DB {
  type: string;
  config: Uri;
}

let db: DB = {
  type: 'mongodb',
  config: {
    username: process.env.dbUserName!,
    password: process.env.dbPassword!,
    host: 'username-gbdqa.gcp.mongodb.net',
    srv: true,
    dbName: prod ? 'dbname' : 'test',
  },
};

export default db;
