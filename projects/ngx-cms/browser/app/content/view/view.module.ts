import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Routes, RouterModule } from '@angular/router';
import { ContentViewComponent } from './view.component';
import { NgxContentViewModule } from '@engineers/ngx-content-view-mat/module';
import { AppInstallDialogComponent } from '../app-install-dialog/app-install-dialog.component';
import { NotificationsDialogComponent } from '../notifications-dialog/notifications-dialog.component';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonModule } from '@angular/material/button';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { ApiInterceptor } from '../../http.interceptor';
import { UniversalInterceptor } from '@engineers/ngx-universal-express/universal-interceptor';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

const routes: Routes = [
  // example: /articles/category.title/[item.slug]~id
  { path: ':category/:item', component: ContentViewComponent },
  // example: /articles/category.title~id
  { path: ':category', component: ContentViewComponent },
  { path: '', component: ContentViewComponent },
];

@NgModule({
  declarations: [
    ContentViewComponent,
    AppInstallDialogComponent,
    NotificationsDialogComponent,
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    NgxContentViewModule,
    MatDialogModule,
    MatIconModule,
    MatTooltipModule,
    MatButtonModule,
    MatProgressSpinnerModule,
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: ApiInterceptor,
      multi: true,
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: UniversalInterceptor,
      multi: true,
    },
  ],
})
export class ContentViewModule {}
