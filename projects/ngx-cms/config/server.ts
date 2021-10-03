// todo: encrypt all sensitive data, or use ${{env:keyName}}
// ex: password=${{env:password}}
// todo: set prod in build time, so we don't need to provide NODE_ENV in runtime

// don't use process.cwd() and process.env.INIT_CWD, use __dirname and __filename
// to use process.cwd(), consider the working directory is project's root i.e: projects/cms
// in this case the project must be started from this location (npm run start),
// starting the project from dist/*/server > node express is wrong

export const prod = process.env.NODE_ENV === 'production';

// use auth code to perform admin operations.
export const AUTH = '';

export const DB = {
  type: 'mongodb',
  auth: ['dbUsername', 'env:dbPass'],
  host: 'username-gbdqa.gcp.mongodb.net',
  srv: true,
  dbName: prod ? 'dbname' : 'test',
};
