import { resolve } from 'node:path';
import { replaceAll } from '@engineers/javascript/string';
import { connect } from '~server/database';
import { supportedCollections } from './supported-collections';
import { backup } from '@engineers/mongoose';
import { write as writeFs } from '@engineers/nodejs/fs';
import { Request, Response } from 'express';

export default (req: Request, res: Response): any => {
  // see /restore route for details
  let filter = req.query.filter
    ? (db?: string, collection?: string) =>
        (req.query.filter as string).split(',').includes(db!)
    : (req.query.all as any) === false
    ? undefined
    : (db: any, collection: any) => {
        if (collection) {
          return supportedCollections.includes(collection);
        }
        return true;
      };

  connect()
    // @ts-ignore: error TS2349: This expression is not callable.
    // Each member of the union type ... has signatures, but none of those signatures are compatible with each other.
    .then((con: any) => {
      let host = con.connection.client.s.options.srvHost,
        now = replaceAll(new Date().toISOString(), ':', '-');

      return backup(con, filter).then((data: any) => {
        let path = `../temp/db-backup/${host}/${now}`,
          info = con.connection.client.s;
        return Promise.all(
          Object.keys(data)
            .map((db: string) =>
              writeFs(resolve(__dirname, `${path}/${db}.json`), data[db])
            )
            .concat([writeFs(resolve(__dirname, `${path}/__info.json`), info)])
        ).then(() => {
          console.log('[backup] Done');
          res.json({ info, data });
        });
      });
    })

    .catch((error: any) => res.json({ error }));
};
