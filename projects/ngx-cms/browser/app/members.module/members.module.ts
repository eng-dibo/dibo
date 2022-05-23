import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Routes, RouterModule } from '@angular/router';

const routes: Routes = [
  {
    matcher: (segments: any, group: any, route: any) =>
      segments[0].path === 'login' ? { consumed: segments.slice(0, 2) } : null,
    loadChildren: () =>
      import('./login.module/login.module').then((modules) => modules.MembersLoginModule),
  },
];

@NgModule({
  declarations: [],
  imports: [CommonModule, RouterModule.forChild(routes)],
  providers: [],
})
export class MembersModule {}
