import {
  server as expressServer,
  run,
} from '@engineers/ngx-universal-express/express';
import { DIST, TEMP } from '~config/server';
import { AppServerModule } from './main';
import { join } from 'path';

import { json as jsonParser, urlencoded as urlParser } from 'body-parser';
import cors from 'cors';
import v1 from './api/v1';
import redirect from '@engineers/express-redirect-middleware';

// The Express app is exported so that it can be used by serverless Functions.
export function server(): ReturnType<typeof expressServer> {
  // todo: move to expressServer.msg
  console.info(`the server is working in ${process.env.NODE_ENV} mode`);

  let browserDir = join(DIST, './core/browser');
  return expressServer({
    browserDir,
    serverModule: AppServerModule,
    // TEMP: cache files, created at runtime
    staticDirs: [browserDir, TEMP],
    transform: (app) => {
      // to use req.protocol in case of using a proxy in between (ex: cloudflare, heroku, ..),
      // without it express may always returns req.protocol="https" even if GET/ https://***
      // https://stackoverflow.com/a/46475726
      app.enable('trust proxy');

      // add trailing slash to all requests,
      // https://expressjs.com/en/guide/using-middleware.html
      // https://dev.to/splodingsocks/getting-all-404s-with-your-firebase-functions-3p1
      app.use((req, res, next) => {
        if (!req.path) {
          req.url = `/{req.url}`;
        }
        next();
      });

      app.use(redirect);
      app.use(jsonParser());
      app.use(urlParser({ extended: true }));

      // access the server API from client-side (i.e: Angular)
      app.use(cors());

      app.use('/api/v1', v1);
      return app;
    },
  });
}

// Webpack will replace 'require' with '__webpack_require__'
// '__non_webpack_require__' is a proxy to Node 'require'
// The below code is to ensure that the server is run only when not requiring the bundle.
declare const __non_webpack_require__: NodeRequire;
let mainModule = __non_webpack_require__.main;
let moduleFilename = (mainModule && mainModule.filename) || '';
if (moduleFilename === __filename || moduleFilename.includes('iisnode')) {
  run(server());
}
