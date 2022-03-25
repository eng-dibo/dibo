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
import { ShareButtonsModule } from 'ngx-sharebuttons/buttons';
import { ShareButtonsConfig } from 'ngx-sharebuttons';
import { ShareIconsModule } from 'ngx-sharebuttons/icons';

const routes: Routes = [{ path: '**', component: ContentViewComponent }];

let shareButtonsConfig: ShareButtonsConfig = {
  include: [
    'facebook',
    'twitter',
    'linkedin',
    'pinterest',
    'whatsapp',
    'telegram',
    'messenger',
    'reddit',
    'sms',
    'copy',
  ],
  theme: 'modern-dark',
  gaTracking: true,
  // todo: twitterAccount: 'twitterUsername',
};

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
    ShareIconsModule,
    // todo: issue: configs are ignored if configured in a lazy-loaded module, but works if configured in AppModule
    // https://github.com/MurhafSousli/ngx-sharebuttons/issues/597
    // after solving this issue remove configs from `<share-buttons>` component
    ShareButtonsModule.withConfig(shareButtonsConfig),
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
