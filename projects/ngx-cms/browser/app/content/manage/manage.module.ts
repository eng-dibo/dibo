import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { ContentManageComponent } from './manage.component';

const routes: Routes = [{ path: '', component: ContentManageComponent }];

@NgModule({
  declarations: [ContentManageComponent],
  imports: [CommonModule, RouterModule.forChild(routes)],
  providers: [],
})
export class ContentManageModule {}
