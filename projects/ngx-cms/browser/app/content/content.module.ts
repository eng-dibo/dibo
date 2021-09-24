import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ViewComponent } from './view/view.component';
import { EditorComponent } from './editor/editor.component';
import { ManageComponent } from './manage/manage.component';

@NgModule({
  declarations: [ViewComponent, EditorComponent, ManageComponent],
  imports: [CommonModule],
})
export class ContentModule {}
