import { Request, Response } from 'express';
import cache from '@engineers/nodejs/cache-fs';
import { APP_BASE_HREF } from '@angular/common';
import { AppOptions } from '../express';

export default (opts: AppOptions) =>
  (request: Request, res: Response): void => {
    // todo: remove `slug` to shorten cache file name
    let temp = `${opts.distPath}/temp/${
      request.path === '/'
        ? '/index'
        : request.path.indexOf('~')
        ? request.path.slice(Math.max(0, request.path.lastIndexOf('~') + 1))
        : request.path
    }.html`;

    cache(
      temp,
      () =>
        new Promise((resolve, reject) => {
          res.render(
            'index.html',
            {
              req: request,
              providers: [
                { provide: APP_BASE_HREF, useValue: request.baseUrl },
              ],
            },
            (error: any, content: string) => {
              error ? reject(error) : resolve(content);
            }
          );
        }),
      { age: 24 * 30 }
    )
      .then((content) => res.send(content))
      .catch((error) => {
        console.error('[server] render', error);
        res.json({ error });
      });
  };
