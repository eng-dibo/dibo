import { Request, Response } from 'express';
import updater from '@engineers/updater';
import { resolve } from 'node:path';

export default (request: Request, res: Response): any => {
  let root = resolve(__dirname, '..'),
    localPath = `${root}`,
    remotePath = `${root}/.remote`,
    repo = (request.query.repo as string) || 'eng-dibo/dibo',
    branch = (request.query.branch as string) || 'main',
    release =
      request.query.release === 'false'
        ? false
        : (request.query.release as string);

  updater({
    remote: {
      repo,
      branch,
      release,
    },
    localPath,
    remotePath,
    cleanFilter: (path) => path !== `${localPath}/config`,
    // todo: add hook download.afterAll() to rename remote.config to config.example
    copyFilter: (path) =>
      path !==
      `${remotePath}/${release ? 'config' : 'projects/ngx-cms/config'}`,
  })
    .run()
    .then((lifecycle) => {
      res.json(lifecycle.store);
    })
    .catch((error: any) => res.status(500).json({ error }));
};
