import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContentViewComponent } from './view/view.component';
import { ContentEditorComponent } from './editor/editor.component';
import { ContentManageComponent } from './manage/manage.component';
import { Routes, RouterModule } from '@angular/router';
import { NgxContentViewModule } from '@engineers/ngx-content-view-mat/module';
import { MetaService } from '@engineers/ngx-utils/meta.service';
import { NgxLoadService } from '@engineers/ngx-utils/load-scripts.service';
import { FormlyModule, FormlyFieldConfig } from '@ngx-formly/core';
import { FormlyMaterialModule } from '@ngx-formly/material';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgxLoadingModule } from 'ngx-loading';
import { FormlyTreeComponent } from './editor/formly-tree/formly-tree.component';
import {
  FormlyFileComponent,
  FileValueAccessor,
} from './editor/formly-file/formly-file.component';
import { QuillModule } from 'ngx-quill';
import { FormlyQuillComponent } from './editor/formly-quill/formly-quill.component';
import { MatTreeModule } from '@angular/material/tree';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatStepperModule } from '@angular/material/stepper';
import { FormlyStepperComponent } from './editor/formly-stepper/formly-stepper.component';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatProgressBarModule } from '@angular/material/progress-bar';

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
    FormlyTreeComponent,
    FormlyFileComponent,
    FileValueAccessor,
    FormlyQuillComponent,
    FormlyStepperComponent,
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    NgxContentViewModule,
    FormsModule,
    ReactiveFormsModule,
    FormlyModule.forRoot({
      types: [
        // todo: add to component instead of module
        {
          name: 'file',
          component: FormlyFileComponent,
          wrappers: ['form-field'],
        },
        {
          name: 'quill',
          component: FormlyQuillComponent,
          wrappers: ['form-field'],
        },
        {
          name: 'categories',
          component: FormlyTreeComponent,
          wrappers: ['form-field'],
        },
        {
          name: 'stepper',
          component: FormlyStepperComponent,
          wrappers: ['form-field'],
        },
      ],
      validationMessages: [
        {
          name: 'required',
          message: (error, field: FormlyFieldConfig) =>
            `${field.key} is required`,
        },
        // validation key for maxLength, minLength must be in lowercase
        // https://github.com/ngx-formly/ngx-formly/issues/1896#issuecomment-995279670
        {
          name: 'minlength',
          message: (error, field: FormlyFieldConfig) =>
            `${field.key} is too short, ${
              field.templateOptions!.minLength! -
              field.formControl!.value.length
            }/${field.templateOptions!.minLength} characters left`,
        },
        {
          name: 'maxlength',
          message: (error, field: FormlyFieldConfig) =>
            `${field.key} is too long, exceeded by ${
              field.templateOptions!.maxLength! -
              field.formControl!.value.length
            }/${field.templateOptions!.maxLength} characters`,
        },
        { name: '', message: (error, field: FormlyFieldConfig) => `` },
      ],
    }),
    FormlyMaterialModule,
    NgxLoadingModule.forRoot({
      primaryColour: 'red',
      secondaryColour: 'blue',
      tertiaryColour: 'green',
    }),
    MatTreeModule,
    MatIconModule,
    MatCheckboxModule,
    MatStepperModule,
    MatButtonModule,
    MatProgressBarModule,
    MatListModule,
    QuillModule.forRoot(),
  ],
  providers: [MetaService, NgxLoadService],
})
export class ContentModule {}
