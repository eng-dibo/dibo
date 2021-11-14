import { Uri } from '@engineers/mongoose';

interface DB {
  type: string;
  config: Uri;
}

let db: DB = {
  type: 'mongodb',
  config: {
    username: process.env.dbUsername!,
    password: process.env.dbPassword!,
    // '<clusterName>-gbdqa.gcp.mongodb.net'
    host: process.env.dbHost,
    srv: true,
    dbName: process.env.dbName,
  },
};

export default db;
