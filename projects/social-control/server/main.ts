// Initialize the server environment, and add DOM types to the global scope
import '@angular/platform-server/init';
import { enableProdMode, NgModule } from '@angular/core';
import env from '../browser/env';
import { ServerModule } from '@angular/platform-server';
import { AppModule } from '~browser/app/app.module';
import { AppComponent } from '~browser/app/app.component';
import { ServerTransferStateModule } from '@angular/platform-server';

if (env.mode === 'production') {
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
