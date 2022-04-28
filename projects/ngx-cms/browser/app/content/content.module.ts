import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Routes, RouterModule } from '@angular/router';
import { NgxLoadService } from '@engineers/ngx-utils/load-scripts.service';
import { QuillModule } from 'ngx-quill';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { PlatformService } from '@engineers/ngx-utils/platform';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { ApiInterceptor } from '../http.interceptor';
import { UniversalInterceptor } from '@engineers/ngx-universal-express/universal-interceptor';

const routes: Routes = [
  {
    matcher: (segments: any, group: any, route: any) =>
      segments.length > 1 &&
      ['articles', 'jobs'].includes(segments[0].path) &&
      segments[1].path === 'editor'
        ? // consume the first 2 segments only (i.e articles/editor), and keep the third segment (i.e /item)
          { consumed: segments.slice(0, 2) }
        : null,
    loadChildren: () =>
      import('./editor/editor.module').then(
        (modules) => modules.ContentEditorModule
      ),
  },
  {
    matcher: (segments: any, group: any, route: any) =>
      segments.length > 1 &&
      ['articles', 'jobs'].includes(segments[0].path) &&
      segments[1].path === 'manage'
        ? { consumed: segments.slice(0, 2) }
        : null,
    loadChildren: () =>
      import('./manage/manage.module').then(
        (modules) => modules.ContentManageModule
      ),
  },

  {
    path: '**',
    loadChildren: () =>
      import('./view/view.module').then((modules) => modules.ContentViewModule),
  },
];

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    MatIconModule,
    MatButtonModule,
    QuillModule.forRoot(),
  ],
  providers: [
    NgxLoadService,
    PlatformService,
    // todo: issue: interceptors that defined in the root module (AppModule)
    // also remove duplicated imported modules
    // for example: MatIconModule is imported here and in both view.module and editor.module
    // are not available in the lazy-loaded modules (ContentModule)
    // they must be provided again in the lazy loaded modules
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
export class ContentModule {}
