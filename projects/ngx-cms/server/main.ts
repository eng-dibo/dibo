import '@angular/platform-server/init';
import { enableProdMode } from '@angular/core';
import env from '~config/env';
import { NgModule } from '@angular/core';
import { ServerModule } from '@angular/platform-server';
import { AppModule } from '~browser/app/app.module';
import { AppComponent } from '~browser/app/app.component';

if (env.mode === 'production') {
  enableProdMode();
}

@NgModule({
  imports: [AppModule, ServerModule],
  bootstrap: [AppComponent],
})
export class AppServerModule {}
export { renderModule, renderModuleFactory } from '@angular/platform-server';
