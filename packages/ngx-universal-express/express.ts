/**
creates the express server

usage example:

 */

// imports for server()
import 'zone.js/dist/zone-node';
// use a version compilable with @angular/common
// ex: for @angular/common@11.x.x -> install @nguniversal/express-engine@^11
import { ngExpressEngine } from '@nguniversal/express-engine';
import express, { Express, Request, Response } from 'express';
import { Server } from 'http';

export interface AppOptions {
  browserDir: string;
  // AppServerModule: from server/main (created by ng cli)
  // todo: create AppServerModule (options:{prod:bool, bootstrap: AppComponent})
  // todo: serverModule type.
  serverModule: any;
  engine?: string;
  staticDirs?: string[];
  staticMaxAge?: string;
  staticFiles?: string[];
}

/**
 * function server() creates the Express server
 * @param options
 * @param cb a callback to modify the app, ex: add express routes (i.e app.get(..))
 * @returns the created Express server.
 *
 * @example
 * import { server ,run } from "@engineers/ngx-universal-express/express";
 * let app = server({ dist: join(__dirname, "../browser", serverModule:AppServerModule ) });
 * app.get('/path', (req,res)=>{...})
 * run(app)
 */
export function server(options: AppOptions): Express {
  let app: Express = express();

  // todo: throw error
  if (!('browserDir' in options)) {
  }
  if (!('serverModule' in options)) {
  }

  let defaultOptions = {
    engine: 'html',
    staticDirs: [options.browserDir],
    staticMaxAge: '1y',
    staticFiles: ['*.*'],
  };

  let appOptions: AppOptions = Object.assign({}, defaultOptions, options);

  // render html templates using @nguniversal/express-engine
  // https://github.com/angular/universal/tree/master/modules/express-engine
  // https://expressjs.com/en/api.html#app.engine
  app.engine(
    appOptions.engine as string,
    ngExpressEngine({
      bootstrap: appOptions.serverModule,
    })
  );

  app.set('view engine', appOptions.engine as string);
  app.set('views', appOptions.browserDir);

  // Serve static files from /browser
  if (appOptions.staticDirs && appOptions.staticDirs.length > 0) {
    appOptions.staticDirs.forEach((dir) => {
      (appOptions.staticFiles as Array<string>).forEach((file: string) =>
        app.get(file, express.static(dir, { maxAge: appOptions.staticMaxAge }))
      );
    });
  }

  return app;
}

export type RunOnListen = (port?: string | number, host?: string) => void;
export type RunOnError = (
  error: any,
  port?: string | number,
  host?: string
) => void;
export interface RunOptions {
  port?: string | number;
  host?: string;
  onListen?: RunOnListen;
  onError?: RunOnError;
}
export function run(expressServer: Express, options: RunOptions = {}): Server {
  let defaultOptions = {
    port: process.env.PORT || 4200,
    onListen: (port?: string | number) => {
      // todo: provide logger (ex: winston)
      console.log(`Node Express server is listening on port ${port}`);
    },
    onError: (error: any, port?: string | number) => {
      console.error(
        `error: Node Express server cannot listen on ${port}`,
        error
      );
    },
  };
  let runOptions = Object.assign({}, defaultOptions, options);

  let httpServer = expressServer.listen(runOptions.port, () => {
    (runOptions.onListen as RunOnListen)(runOptions.port, runOptions.host);
  });

  httpServer.on('error', (error: any) => {
    (runOptions.onListen as RunOnError)(
      error,
      runOptions.port,
      runOptions.host
    );
  });

  return httpServer;
}
