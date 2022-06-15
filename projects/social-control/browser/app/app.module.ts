import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { InitialNavigation, RouterModule, Routes } from '@angular/router';

const routes: Routes = [];
const enableTracing = false;

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule.withServerTransition({ appId: 'serverApp' }),
    BrowserAnimationsModule,
    RouterModule.forRoot(routes, {
      initialNavigation: 'enabled' as InitialNavigation,
      enableTracing,
    }),
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
