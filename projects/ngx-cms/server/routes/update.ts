import { Request, Response } from 'express';
import updater from '@engineers/updater';
import { resolve } from 'node:path';

export default (req: Request, res: Response): any => {
  let root = resolve(__dirname, '..'),
    localPath = `${root}`,
    remotePath = `${root}/.remote`,
    repo = (req.query.repo as string) || 'eng-dibo/dibo',
    branch = (req.query.branch as string) || 'main',
    release =
      req.query.release === 'false' ? false : (req.query.release as string);

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
