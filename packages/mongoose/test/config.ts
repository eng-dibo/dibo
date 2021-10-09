import { Uri } from '../index';

// todo: get uri from user.env!!.json
// https://cloud.mongodb.com/v2/5bc831c29ccf64e6ceb8d15b#metrics/replicaSet/60f01cd09f632f7e383aff79/explorer
// xx+testing@g
export let uri: Uri = {
  host: process.env.db_host || 'cluster0.v3unb.mongodb.net',
  username: process.env.db_username || 'admin',
  password: process.env.db_password || 'Testing@xx',
  srv: true,
  dbName: 'spec',
};
