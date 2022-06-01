import { resolve } from 'node:path';
import { existsSync } from 'node:fs';
import { replaceAll } from '@engineers/javascript/string';
import { connect } from '~server/database';
import { supportedCollections } from './supported-collections';
import { backup } from '@engineers/mongoose';
import { write as writeFs } from '@engineers/nodejs/fs';
import { Request, Response } from 'express';
import { storage } from '~server/storage';

export default (request: Request, res: Response): any => {
  let temporary = resolve(__dirname, '../backup/');

  Promise.all([
    request.query.db === 'false'
      ? null
      : connect()
          // @ts-ignore: error TS2349: This expression is not callable.
          // Each member of the union type ... has signatures, but none of those signatures are compatible with each other.
          .then((con: any) => {
            // see /restore route for details
            let filter = request.query.filter
              ? (database?: string, collection?: string) =>
                  (request.query.filter as string)
                    .split(',')
                    .includes(database!)
              : (request.query.all as any) === false
              ? undefined
              : (database: any, collection: any) => {
                  if (collection) {
                    return supportedCollections.includes(collection);
                  }
                  return true;
                };

            let host = con.connection.client.s.options.srvHost,
              now = replaceAll(new Date().toISOString(), ':', '-');

            return backup(con, filter).then((data: any) => {
              let path = `${temporary}/db/${host}/${now}`,
                info = con.connection.client.s;
              return Promise.all([
                ...Object.keys(data).map((database: string) =>
                  writeFs(
                    resolve(__dirname, `${path}/${database}.json`),
                    data[database]
                  )
                ),
                writeFs(resolve(__dirname, `${path}/__info.json`), info),
              ]).then(() => ({ info, data }));
            });
          }),
    request.query.storage === 'false'
      ? null
      : storage.downloadAll(
          `${temporary}/storage`,
          undefined,
          (file: string) => !existsSync(`${temporary}/storage/${file}`)
        ),
  ])
    .then((result) => {
      console.log('[backup] Done');
      res.json({ db: result[0], storage: result[1] });
    })
    .catch((error: any) => {
      console.error(error);
      res.status(500).json({ error });
    });
};
