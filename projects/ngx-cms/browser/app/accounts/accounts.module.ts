import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ViewComponent } from './view/view.component';
import { RouterModule, Routes } from '@angular/router';
import { NgxContentViewModule } from '@engineers/ngx-content-view-mat/module';

const routes: Routes = [{ path: '**', component: ViewComponent }];

@NgModule({
  declarations: [ViewComponent],
  imports: [CommonModule, RouterModule.forChild(routes), NgxContentViewModule],
})
export class AccountsModule {}
