// database and storage systems should be separated from the server logic
// so the developer can change their implementation easily

import { server as expressServer, run } from '@engineers/ngx-universal-express';
import { AppServerModule } from './main';
import { json as jsonParser, urlencoded as urlParser } from 'body-parser';
import cors from 'cors';
import routes, { apiVersion } from './routes';
import redirect from '@engineers/express-redirect-middleware';
import { resolve } from 'node:path';
import { NextFunction, Request, Response, Router } from 'express';
import sitemapRoute from './routes/sitemap';
import angularRoute from './routes/angular';

export interface AppOptions {
  // relative to dist/ngx-cms/server
  // this may be have different values for different compilation scenarios
  // for instance, with `ts-node server/express.ts`, __dirname = '/server'
  // also `jest` transpiles .ts files on the fly, but doesn't output to 'dist' folder
  distPath?: string;
  apiVersion?: number;
  mode?: string;
  routes?: Router;
}

/**
 *
 * @param options
 */
// this function could be used by other projects that have the similar server structure
// so we exported it to be reusable
export function createApp(
  options: AppOptions = {}
): ReturnType<typeof expressServer> {
  let opts = Object.assign(
    {
      distPath: resolve(__dirname, '..'),
      apiVersion,
      mode: process.env.NODE_ENV || 'production',
    },
    options
  );

  console.info(`the server is working in ${opts.mode} mode`);

  let app = expressServer({
    browserDir: `${opts.distPath}/browser`,
    serverModule: AppServerModule,
    staticDirs: [
      `${opts.distPath}/browser`,
      `${opts.distPath}/temp`,
      `${opts.distPath}/config/browser`,
    ],
  });

  // to use req.protocol in case of using a proxy in between (ex: cloudflare, heroku, ..),
  // without it express may always returns req.protocol="https" even if GET/ https://***
  // https://stackoverflow.com/a/46475726
  app.enable('trust proxy');

  // add trailing slash to all requests,
  // https://expressjs.com/en/guide/using-middleware.html
  // https://dev.to/splodingsocks/getting-all-404s-with-your-firebase-functions-3p1
  app.use((request: Request, res: Response, next: NextFunction) => {
    if (!request.path) {
      request.url = `/{req.url}`;
    }
    next();
  });

  // redirect to 'https://wwww.*'
  app.use(
    redirect({
      protocol: 'https',
      subdomain: 'www',
      cb: (oldUrl, newUrl, parts) => {
        if (opts.mode !== 'production') {
          console.info(`[server] redirecting ${oldUrl} -> ${newUrl}`, {
            parts,
          });
        }
      },
    })
  );

  // log info about the request
  app.use((request: Request, res: Response, next: NextFunction) => {
    if (opts.mode === 'development') {
      console.info(`[server] ${request.method} ${request.originalUrl}`);
    }
    next();
  });
  app.use(jsonParser());
  app.use(urlParser({ extended: true }));

  // access the server API from client-side (i.e: Angular)
  app.use(cors());

  if (opts.routes && opts.apiVersion) {
    // invalid or deprecated api version
    app.use(
      '/api/:version',
      (request: Request, res: Response, next: NextFunction) => {
        if (request.params.version !== `v${opts.apiVersion.toString()}`) {
          next(
            `${request.originalUrl} is an invalid or deprecated request, use /api/v${opts.apiVersion}`
          );
        } else {
          next();
        }
      }
    );

    app.use(`/api/v${opts.apiVersion}`, routes);
  }

  return app;
}

// The Express app is exported so that it can be used by serverless Functions.
/**
 *
 */
export function server() {
  // todo: use opts from createApp()
  let options: AppOptions = {
    distPath: resolve(__dirname, '..'),
    apiVersion,
    routes,
  };
  let app = createApp(options);
  app.get('/sitemap.xml', sitemapRoute);
  // prevent non-existing static files from reaching the regular route, i.e app.get('*')
  app.use('*.*', (request: Request, res: Response) => {
    throw new Error(`static file ${request.originalUrl} not found`);
  });

  // All regular routes use the Universal engine, must be after all other routes
  app.get('*', angularRoute(options));

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
