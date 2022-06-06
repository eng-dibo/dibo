/* eslint-disable import/no-unresolved */
// Initialize the server environment, and add DOM types to the global scope
import '@angular/platform-server/init';
import { NgModule, enableProdMode } from '@angular/core';
import environment from '../browser/env';
import {
  ServerModule,
  ServerTransferStateModule,
} from '@angular/platform-server';
import { AppModule } from '~browser/app/app.module';
import { AppComponent } from '~browser/app/app.component';

if (environment.mode === 'production') {
  enableProdMode();
}

@NgModule({
  imports: [
    AppModule,
    ServerModule,
    // https://andremonteiro.pt/caching-server-side-requests-ng-universal
    ServerTransferStateModule,
  ],
  bootstrap: [AppComponent],
})
export class AppServerModule {}
export { renderModule, renderModuleFactory } from '@angular/platform-server';
