import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContentEditorComponent } from './editor.component';
import { Routes, RouterModule } from '@angular/router';
import { MetaService } from '@engineers/ngx-utils/meta.service';
import { NgxLoadService } from '@engineers/ngx-utils/load-scripts.service';
import { FormlyModule, FormlyFieldConfig } from '@ngx-formly/core';
import { FormlyMaterialModule } from '@ngx-formly/material';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FormlyTreeComponent } from './formly-tree/formly-tree.component';
import {
  FormlyFileComponent,
  FileValueAccessor,
} from './formly-file/formly-file.component';
import { QuillModule } from 'ngx-quill';
import { FormlyQuillComponent } from './formly-quill/formly-quill.component';
import { MatTreeModule } from '@angular/material/tree';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatStepperModule } from '@angular/material/stepper';
import { FormlyStepperComponent } from './formly-stepper/formly-stepper.component';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDialogModule } from '@angular/material/dialog';
import { PlatformService } from '@engineers/ngx-utils/platform';
import { MatSnackBarModule } from '@angular/material/snack-bar';

const routes: Routes = [
  { path: ':item', component: ContentEditorComponent },
  { path: '', component: ContentEditorComponent },
];

@NgModule({
  declarations: [
    ContentEditorComponent,
    FormlyTreeComponent,
    FormlyFileComponent,
    FileValueAccessor,
    FormlyQuillComponent,
    FormlyStepperComponent,
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
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
    MatTreeModule,
    MatIconModule,
    MatCheckboxModule,
    MatStepperModule,
    MatButtonModule,
    MatProgressBarModule,
    MatListModule,
    MatDialogModule,
    QuillModule.forRoot(),
    MatSnackBarModule,
  ],
  providers: [MetaService, NgxLoadService, PlatformService],
})
export class ContentEditorModule {}
