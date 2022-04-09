import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { ErrorComponent } from './error/error.component';
import { Routes, RouterModule, InitialNavigation } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { UniversalInterceptor } from '@engineers/ngx-universal-express/universal-interceptor';
import { ApiInterceptor } from './http.interceptor';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ServiceWorkerModule } from '@angular/service-worker';
import { TransferHttpCacheModule } from '@nguniversal/common';
import env from '../env';

const routes: Routes = [];

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

    // https://andremonteiro.pt/caching-server-side-requests-ng-universal
    TransferHttpCacheModule,
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
