import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContentViewComponent } from './view/view.component';
import { ContentEditorComponent } from './editor/editor.component';
import { ContentManageComponent } from './manage/manage.component';
import { Routes, RouterModule } from '@angular/router';
import { NgxContentViewModule } from '@engineers/ngx-content-view-mat/module';
import { MetaService } from '@engineers/ngx-utils/meta.service';
import { NgxLoadService } from '@engineers/ngx-utils/load-scripts.service';
import { FormlyModule } from '@ngx-formly/core';
import { FormlyMaterialModule } from '@ngx-formly/material';
import { NgxLoadingModule } from 'ngx-loading';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

const routes: Routes = [
  { path: ':type/editor/:item', component: ContentEditorComponent },
  { path: ':type/editor', component: ContentEditorComponent },
  { path: ':type/manage', component: ContentManageComponent },
  // example: /articles/category.title/[item.slug]~id
  { path: ':type/:category/:item', component: ContentViewComponent },
  // example: /articles/category.title
  // example: /articles/[item.slug]~item.id
  { path: ':type/:item', component: ContentViewComponent },
  { path: ':type', component: ContentViewComponent },

  //or: redirectTo: "articles",
  { path: '', component: ContentViewComponent, pathMatch: 'full' },
];

@NgModule({
  declarations: [
    ContentViewComponent,
    ContentEditorComponent,
    ContentManageComponent,
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    NgxContentViewModule,
    FormsModule,
    ReactiveFormsModule,
    FormlyModule.forRoot(),
    FormlyMaterialModule,
  ],
  providers: [MetaService, NgxLoadService],
})
export class ContentModule {}
