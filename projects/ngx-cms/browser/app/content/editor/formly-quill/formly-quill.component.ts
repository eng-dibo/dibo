import { Component } from '@angular/core';
import { FieldType } from '@ngx-formly/material';
import { FormControl } from '@angular/forms';

@Component({
  selector: 'formly-field-quill',
  template: `
    <quill-editor
      [formControl]="formControl"
      [formlyAttributes]="field"
      [modules]="to.modules"
    ></quill-editor>
  `,
  styleUrls: ['./formly-quill.component.scss'],
})
export class FormlyQuillComponent extends FieldType {
  // @Input() modules = {};

  // to avoid the error cannot bind to AbstractControl
  // https://github.com/ngx-formly/ngx-formly/issues/1981#issuecomment-566027035
  // https://github.com/ngx-formly/ngx-formly/issues/1981#issuecomment-750050210
  // or use $any() https://github.com/primefaces/primeng/issues/9636#issuecomment-786608380
  // todo: import {FieldType} from @engineers/ngx-formly (define formControl)
  formControl: FormControl;
}
