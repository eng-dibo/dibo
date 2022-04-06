// transform the data (if needed) before running this route

import { existsSync, readdirSync } from 'node:fs';
import { extname, resolve } from 'node:path';
import { toRegExp } from '@engineers/javascript/regex';
import { restore } from '@engineers/mongoose';
import { connect } from '~server/database';
import { supportedCollections } from './supported-collections';
import { read as readFS } from '@engineers/nodejs/fs';
import { Request, Response } from 'express';

// add/remove data or drop a database
export default (req: Request, res: Response): any => {
  let hosts = req.params.hosts;
  let existingHosts = readdirSync(resolve(__dirname, `../temp/db-backup`));

  if (!hosts) {
    return res.json({
      error: `
        provide a host name or pattern (or multiple hosts), 
        example: /restore/myhost.gbdqa.gcp.mongodb.net,myho.+  
  
        available hosts:
        ${existingHosts.map(
          (el) =>
            el.replace(resolve(__dirname, '../temp/db-backup'), '') + '\r\n'
        )}
        `,
    });
  }

  connect()
    .then(() =>
      Promise.all(
        existingHosts
          .filter((host) => toRegExp(hosts.split(',')).test(host))
          .map((host) => {
            console.log(`> restoring from ${host}`);

            let hostPath = resolve(__dirname, `../temp/db-backup/${host}`);
            if (!existsSync) {
              throw `the host ${host} not existing`;
            }

            // todo: sort by name
            let backupPath = resolve(hostPath, readdirSync(hostPath)[0]);
            if (backupPath.length === 0) {
              console.warn(`no backup files for the host ${host}`);
              Promise.resolve();
            }

            let filter =
              // filter databases by querystring, example: ?filter=db1,db2
              // todo: filter collections ?filter=db1,db2:coll1,coll2,db3:!coll4
              req.query.filter
                ? (db?: string, collection?: string) =>
                    (req.query.filter as string).split(',').includes(db!)
                : // disable filtering
                req.query.all === false
                ? undefined
                : // by default, only restore supportedCollections
                  (db: any, collection: any) => {
                    if (db === '__info') {
                      return false;
                    }
                    if (collection) {
                      // todo: if ?supportedCollections!==false
                      return supportedCollections.includes(collection);
                    }
                    return true;
                  };

            return Promise.all(
              readdirSync(backupPath).map((file: string) => {
                let filePath = resolve(`${backupPath}/${file}`);
                if (extname(filePath) !== '.json') {
                  return;
                }
                console.log({ backupPath });
                return (
                  readFS(filePath)
                    .then((content: any) => {
                      restore({ [file.replace('.json', '')]: content }, filter);
                    })
                    // todo: move .catch() to the top-level of Promise chain
                    .catch((error) => {
                      console.log(`[restore] error in restore()`, { error });
                      throw error;
                    })
                );
              })
            );
          })
      )
    )
    .then(() => res.json({ done: true }))
    .catch((error) => res.json({ error }));
};
