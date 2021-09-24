import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ViewComponent } from './view/view.component';
import { EditorComponent } from './editor/editor.component';
import { ManageComponent } from './manage/manage.component';
import { Routes, RouterModule } from '@angular/router';

const routes: Routes = [
  // example: /articles/category-slug/item-slug=123
  { path: ':type', component: ViewComponent },
  { path: ':type/editor', component: EditorComponent },
  { path: ':type/editor/:item', component: EditorComponent },
  { path: ':type/manage', component: ManageComponent },
  { path: ':type/item/:item', component: ViewComponent },
  { path: ':type/:category/:item', component: ViewComponent },
  { path: ':type/:category', component: ViewComponent },
  //or: redirectTo: "articles",
  { path: '', component: ViewComponent, pathMatch: 'full' },
];

@NgModule({
  declarations: [ViewComponent, EditorComponent, ManageComponent],
  imports: [CommonModule, RouterModule.forChild(routes)],
})
export class ContentModule {}
