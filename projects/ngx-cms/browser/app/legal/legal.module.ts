/* free legal pages generators:
https://www.privacypolicygenerator.info
https://www.termsofusegenerator.net
https://app.termly.io/dashboard
*/

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PrivacyPolicyComponent } from './privacy-policy/privacy-policy.component';
import { RouterModule, Routes } from '@angular/router';
import { TermsOfServiceComponent } from './terms-of-service/terms-of-service.component';
import { ErrorComponent } from '../error/error.component';

const routes: Routes = [
  { path: 'privacy-policy', component: PrivacyPolicyComponent },
  { path: 'terms-of-service', component: TermsOfServiceComponent },
  { path: '**', component: ErrorComponent },
];

@NgModule({
  declarations: [PrivacyPolicyComponent, TermsOfServiceComponent],
  imports: [CommonModule, RouterModule.forChild(routes)],
})
export class LegalModule {}
