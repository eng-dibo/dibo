import { resolve } from 'node:path';
import { AppOptions, createApp } from '~~projects/ngx-cms/server/express';
import routes, { apiVersion } from './routes';
import { Request, Response } from 'express';

/**
 *
 */
export function server() {
  let options: AppOptions = {
    distPath: resolve(__dirname, '..'),
    apiVersion,
    routes,
  };
  let app = createApp(options);
  // prevent non-existing static files from reaching the regular route, i.e app.get('*')
  app.use('*.*', (request: Request, res: Response) => {
    throw new Error(`static file ${request.originalUrl} not found`);
  });

  return app;
}
