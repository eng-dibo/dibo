import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import environment from './env';

if (environment.mode === 'production') {
  enableProdMode();
}

document.addEventListener('DOMContentLoaded', () => {
  platformBrowserDynamic()
    .bootstrapModule(AppModule)
    .catch((error) => console.error(error));
});
