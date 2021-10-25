import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContentViewComponent } from './view/view.component';
import { EditorComponent } from './editor/editor.component';
import { ManageComponent } from './manage/manage.component';
import { Routes, RouterModule } from '@angular/router';
import { NgxContentViewModule } from '@engineers/ngx-content-view-mat/module';
import { MetaService } from '@engineers/ngx-utils/meta.service';
import { NgxLoadService } from '@engineers/ngx-utils/load-scripts.service';

const routes: Routes = [
  // example: /articles/category-slug/item-slug=123
  { path: ':type', component: ContentViewComponent },
  { path: ':type/editor', component: EditorComponent },
  { path: ':type/editor/:item', component: EditorComponent },
  { path: ':type/manage', component: ManageComponent },
  { path: ':type/item/:item', component: ContentViewComponent },
  { path: ':type/:category/:item', component: ContentViewComponent },
  { path: ':type/:category', component: ContentViewComponent },
  //or: redirectTo: "articles",
  { path: '', component: ContentViewComponent, pathMatch: 'full' },
];

@NgModule({
  declarations: [ContentViewComponent, EditorComponent, ManageComponent],
  imports: [CommonModule, RouterModule.forChild(routes), NgxContentViewModule],
  providers: [MetaService, NgxLoadService],
})
export class ContentModule {}
