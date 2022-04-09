// database and storage systems should be separated from the server logic
// so the developer can change their implementation easily

import {
  server as expressServer,
  run,
} from '@engineers/ngx-universal-express/express';
import { AppServerModule } from './main';
import { json as jsonParser, urlencoded as urlParser } from 'body-parser';
import cors from 'cors';
import routes from './routes';
import redirect from '@engineers/express-redirect-middleware';
import { resolve } from 'path';
import { apiVersion } from './routes';
import { APP_BASE_HREF } from '@angular/common';
import { Request, Response, NextFunction } from 'express';
import cache from '@engineers/nodejs/cache-fs';

let mode = process.env.NODE_ENV || 'production';
export const TEMP = resolve(__dirname, '../temp');

// The Express app is exported so that it can be used by serverless Functions.
export function server(): ReturnType<typeof expressServer> {
  // todo: move to expressServer.msg
  console.info(`the server is working in ${mode} mode`);

  // relative to dist/ngx-cms/server
  // this may be have different values for different compilation scenarios
  // for instance, with `ts-node server/express.ts`, __dirname = '/server'
  // also `jest` transpiles .ts files on the fly, but doesn't output to 'dist' folder
  let distFolder = resolve(__dirname, '..'),
    browserDir = distFolder + '/browser',
    tempDir = distFolder + '/temp',
    configDir = distFolder + '/config/browser';

  let app = expressServer({
    browserDir,
    serverModule: AppServerModule,
    // TEMP: cache files, created at runtime
    // todo: use system.temp
    staticDirs: [browserDir, tempDir, configDir],
  });

  // to use req.protocol in case of using a proxy in between (ex: cloudflare, heroku, ..),
  // without it express may always returns req.protocol="https" even if GET/ https://***
  // https://stackoverflow.com/a/46475726
  app.enable('trust proxy');

  // add trailing slash to all requests,
  // https://expressjs.com/en/guide/using-middleware.html
  // https://dev.to/splodingsocks/getting-all-404s-with-your-firebase-functions-3p1
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (!req.path) {
      req.url = `/{req.url}`;
    }
    next();
  });

  // redirect to 'https://wwww.*'
  app.use(
    redirect({
      protocol: 'https',
      subdomain: 'www',
      cb: (oldUrl, newUrl, parts) => {
        if (mode !== 'production') {
          console.info(`[server] redirecting ${oldUrl} -> ${newUrl}`, {
            parts,
          });
        }
      },
    })
  );

  // log info about the request
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (mode === 'development') {
      console.info(`[server] ${req.method} ${req.originalUrl}`);
    }
    next();
  });
  app.use(jsonParser());
  app.use(urlParser({ extended: true }));

  // access the server API from client-side (i.e: Angular)
  app.use(cors());

  // invalid or deprecated api version
  app.use(
    '/api/:version',
    (req: Request, res: Response, next: NextFunction) => {
      if (req.params.version !== `v${apiVersion.toString()}`) {
        next(
          `${req.originalUrl} is an invalid or deprecated request, use /api/v${apiVersion}`
        );
      } else {
        next();
      }
    }
  );
  app.use(`/api/v${apiVersion}`, routes);

  // prevent non-existing static files from reaching the regular route, i.e app.get('*')
  app.use('*.*', (req: Request, res: Responsen) => {
    throw new Error(`static file ${req.originalUrl} not found`);
  });

  // All regular routes use the Universal engine, must be after all other routes
  app.get('*', (req: Request, res: Response): void => {
    // todo: remove `slug` to shorten cache file name
    let tmp = `${TEMP}${
      req.path === '/'
        ? '/index'
        : req.path.indexOf('~')
        ? req.path.substring(req.path.lastIndexOf('~') + 1)
        : req.path
    }.html`;

    cache(
      tmp,
      () =>
        new Promise((resolve, reject) => {
          res.render(
            'index.html',
            {
              req,
              providers: [{ provide: APP_BASE_HREF, useValue: req.baseUrl }],
            },
            (err: any, content: string) => {
              err ? reject(err) : resolve(content);
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
  });

  return app;
}

// Start up the Node server
// firebase starts the server automatically, so we don't need to start it again (error)
// todo: onError, try port++
if (process.argv[2] == '--start') {
  run(server());
}

/* 
// by @nguniversal/express-engine:
// Webpack will replace 'require' with '__webpack_require__'
// '__non_webpack_require__' is a proxy to Node 'require'
// The below code is to ensure that the server is run only when not requiring the bundle.
declare const __non_webpack_require__: NodeRequire;
let mainModule = __non_webpack_require__.main;
let moduleFilename = (mainModule && mainModule.filename) || '';
if (moduleFilename === __filename || moduleFilename.includes('iisnode')) {
  run(server());
}
*/
