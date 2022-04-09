import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormlyFieldCategories,
  FormlyFieldCategoriesHelper,
} from './component';

@NgModule({
  declarations: [FormlyFieldCategories, FormlyFieldCategoriesHelper],
  imports: [CommonModule],
})
export class FormlyCategoriesModule {}
