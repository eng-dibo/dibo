import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ContentModule } from './content/content.module';
import { ErrorComponent } from './error/error.component';
import { Routes, RouterModule, InitialNavigation } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { UniversalInterceptor } from '@engineers/ngx-universal-express/universal-interceptor';
import { ApiInterceptor } from './http.interceptor';
import env from '~config/env';

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
  //  { path: "", component: AppComponent, pathMatch: "full" }
];
const endRoutes: Routes = [{ path: '**', component: ErrorComponent }];
const enableTracing = false; // env.mode === 'development';

@NgModule({
  declarations: [AppComponent, ErrorComponent],
  imports: [
    RouterModule.forRoot(appRoutes, {
      initialNavigation: 'enabled' as InitialNavigation,
      enableTracing,
    }),
    BrowserModule.withServerTransition({ appId: 'serverApp' }),
    AppRoutingModule,
    ContentModule,
    RouterModule.forRoot(endRoutes, { enableTracing }),
    BrowserModule.withServerTransition({ appId: 'serverApp' }),
    BrowserAnimationsModule,
    MatToolbarModule,
    HttpClientModule,
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
