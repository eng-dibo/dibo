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
const appRoutes: Routes = [
  // to lazy-load a module, use loadChildren
  // https://angular.io/guide/lazy-loading-ngmodules
  // to make providers[] available mark services as {providedIn: 'root' or 'any'}
  // https://angular.io/guide/providers#limiting-provider-scope-by-lazy-loading-modules
  // https://github.com/angular/angular/issues/37441#issuecomment-639737971

  {
    path: '',
    pathMatch: 'full',
    loadChildren: () =>
      import('./content/content.module').then(
        (modules) => modules.ContentModule
      ),
  },
];

// import after importing all feature modules
const endRoutes: Routes = [
  // the home page, if not defined in another feature module
  { path: '', component: AppComponent, pathMatch: 'full' },
  { path: '**', component: ErrorComponent },
];
const enableTracing = false; // env.mode === 'development';

@NgModule({
  declarations: [AppComponent, ErrorComponent],
  imports: [
    RouterModule.forRoot(appRoutes, {
      initialNavigation: 'enabled' as InitialNavigation,
      enableTracing,
    }),
    BrowserModule.withServerTransition({ appId: 'serverApp' }),
    // ContentModule,
    RouterModule.forRoot(endRoutes, { enableTracing }),
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
