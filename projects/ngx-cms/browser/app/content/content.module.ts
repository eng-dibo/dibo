import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { NgxLoadService } from '@engineers/ngx-utils/load-scripts.service';
import { PlatformService } from '@engineers/ngx-utils/platform';
import { RouterModule, Routes } from '@angular/router';

import { QuillModule } from 'ngx-quill';

const routes: Routes = [
  {
    matcher: (segments: any, group: any, route: any) =>
      segments.length > 1 && segments[1].path === 'editor'
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
      segments.length > 1 && segments[1].path === 'manage'
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
  providers: [NgxLoadService, PlatformService],
})
export class ContentModule {}
