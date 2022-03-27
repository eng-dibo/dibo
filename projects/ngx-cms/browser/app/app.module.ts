import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ContentModule } from './content/content.module';
import { ErrorComponent } from './error/error.component';
import { Routes, RouterModule, InitialNavigation } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { UniversalInterceptor } from '@engineers/ngx-universal-express/universal-interceptor';
import { ApiInterceptor } from './http.interceptor';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ServiceWorkerModule } from '@angular/service-worker';
import { ContentViewModule } from './content/view/view.module';
import { ContentViewComponent } from './content/view/view.component';
import env from '../env';

/*
routes are loaded in the following order:
 1- appRoutes: all routes in the project, except endRoutes, contentRoutes (dynamic routes)
 2- contentRoutes comes after appRoutes because it contains dynamic paths ex: /:type
 3- endRoutes: contains the routes that must be loaded after all other routs,
    such as "**" (i.e: error component)
 -> Modules are proceeded before RouterModule.forRoot() and RouterModule.forChild()
    we need to load AppRutingModule first then routes defineded in ContentModule (contains RouterModule.forChild())
    then endRoutes in the last (because it contains '**')
 -> @NgModule processes before RouterModule.forRoot()
 https://blogs.msmvps.com/deborahk/angular-route-ordering/
 */
const routes: Routes = [
  // to lazy-load a module, use loadChildren
  // https://angular.io/guide/lazy-loading-ngmodules
  // to make providers[] available in lazy-loaded modules mark services as {providedIn: 'root' or 'any'}
  // https://angular.io/guide/providers#limiting-provider-scope-by-lazy-loading-modules
  // https://github.com/angular/angular/issues/37441#issuecomment-639737971

  {
    // todo: a temporary workaround for https://github.com/angular/angular/issues/45453
    // load ContentViewComponent non-lazily
    // add ContentViewModule to modules, remove it's routes
    // match / and 'articles|jobs/*' but not 'articles|jobs/editor|manage/*'
    matcher: (segments: any, group: any, route: any) =>
      segments.length === 0 ||
      (['articles', 'jobs'].includes(segments[0].path) &&
        (segments.length === 1 ||
          !['editor', 'manage'].includes(segments[1].path)))
        ? { consumed: segments }
        : null,
    component: ContentViewComponent,
  },
  {
    matcher: (segments: any, group: any, route: any) =>
      segments.length === 0 || ['articles', 'jobs'].includes(segments[0].path)
        ? // todo: params.type=segments[0].path
          // set consumed as an empty array, so routes in content.modules get the full segments array
          // if you set `consumed: [segments[0]]`, routes in content.modules receive the segments after /articles only
          // if you set `consumed: segments`, they receive an empty segments[]
          { consumed: [] }
        : null,
    loadChildren: () =>
      import('./content/content.module').then(
        (modules) => modules.ContentModule
      ),
  },
  // default routes, if no other route matched
  { path: '**', component: ErrorComponent },
];

const enableTracing = false; // env.mode === 'development';

@NgModule({
  declarations: [AppComponent, ErrorComponent],
  imports: [
    BrowserModule.withServerTransition({ appId: 'serverApp' }),
    BrowserAnimationsModule,
    MatToolbarModule,
    MatTooltipModule,
    HttpClientModule,
    ServiceWorkerModule.register('ngsw-worker.js', {
      enabled: true,
      // Register the ServiceWorker as soon as the app is stable
      // or after 30 seconds (whichever comes first).
      registrationStrategy: 'registerWhenStable:30000',
    }),
    ContentViewModule,
    // keep router module after all other feature modules,
    // so the default routes doesn't override other routes defined by feature modules
    RouterModule.forRoot(routes, {
      initialNavigation: 'enabled' as InitialNavigation,
      enableTracing,
    }),
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      // must be provided before 'UniversalInterceptor'
      useClass: ApiInterceptor,
      multi: true,
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: UniversalInterceptor,
      // use 'multi' to add multiple interceptors that intercept the request in the same order they provided.
      multi: true,
    },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
