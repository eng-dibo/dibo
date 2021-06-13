/*
creates the express server

usage example:
import { server as expressServer,run } from "@engineers/ngx-universal-express/express";
export function server() {
  let app = expressServer({ dist: join(__dirname, "../browser", serverModule:AppServerModule ) });
  app.get('/path', (req,res)=>{...})
  return app
}
 */
/*
//imports for serverModule()
import { enableProdMode } from "@angular/core";
import { NgModule } from "@angular/core";
import { ServerModule } from "@angular/platform-server";
*/

// imports for server()
import 'zone.js/dist/zone-node';
import { ngExpressEngine } from '@nguniversal/express-engine';
import express, { Express } from 'express';
import { APP_BASE_HREF } from '@angular/common';
import { Server } from 'http';

/*
export interface ServerModuleOptions {
  //bootstrap component (AppComponent)
  //todo: type = component
  bootstrap: any;
  //App module (from app.module.ts)
  browserModule: any;
  prod?: boolean;
}
export function serverModule(options: ServerModuleOptions): any {
  let defaultOptions = {
    prod: true
  };
  if (options.prod) {
    enableProdMode();
  }
  @NgModule({
    imports: [options.browserModule, ServerModule],
    bootstrap: [options.bootstrap]
  })
  //todo: return class AppServerModule
  return  class AppServerModule {}
  //export { renderModule, renderModuleFactory } from "@angular/platform-server";
}
*/

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
  indexFile?: string;
  prod?: boolean;
  // allow the consumer to modify app (ex: adding routes)
  // before the final route (i.e: "*") added.
  transform?: (app: Express) => Express | undefined;
}

/**
 * function server() creates the Express server
 * @param options
 * @param cb a callback to modify the app, ex: add express routes (i.e app.get(..))
 * @returns the created Express server.
 *
 * The Express server() is exported so that it can be used by serverless Functions.
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
    indexFile: 'index.html',
  };

  let appOptions: AppOptions = Object.assign({}, defaultOptions, options);

  // Universal express-engine
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

  if (appOptions.transform && typeof appOptions.transform === 'function') {
    // app may be changed by reference, transform() doesn't have to return it.
    app = appOptions.transform(app) || app;
  }

  // All regular routes use the Universal engine, must be after all other routes
  app.get('*', (req, res) => {
    res.render(appOptions.indexFile as string, {
      req,
      providers: [{ provide: APP_BASE_HREF, useValue: req.baseUrl }],
    });
  });

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
    host: 'http://localhost',
    onListen: (port?: string | number, host?: string) => {
      // todo: provide logger (ex: winston)
      console.log(`Node Express server is listening on ${host}:${port}`);
    },
    onError: (error: any, port?: string | number, host?: string) => {
      console.error(
        `error: Node Express server cannot listen on ${host}:${port}`,
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
