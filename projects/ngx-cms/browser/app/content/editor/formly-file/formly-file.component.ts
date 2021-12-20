// formly doesn't support 'file' type, so we create a custom one.
// todo: pass attributes, such as style="display:none;" to replace it with a button
// add it to module:   FormlyModule.forRoot({types: [{ name: 'file', component: FormlyFieldFile, wrappers:['form-field'] }, ]}),
// todo: pass label:  {type:"file",label:"we don't want this value,
// pass it to out child component as an attribute", templateOptions:{attributes:{label:"cover image"}}}
// todo: emit events: progress, response, change (fileAdded)
// todo: move custom types (such as quill) out of formly

import { Component, Directive, ViewChild, Input, OnInit } from '@angular/core';
import { FieldType } from '@ngx-formly/material';
import {
  NG_VALUE_ACCESSOR,
  ControlValueAccessor,
  FormControl,
} from '@angular/forms';

@Component({
  selector: 'formly-field-file',
  templateUrl: './formly-file.component.html',
  styleUrls: ['./formly-file.component.scss'],
})
export class FormlyFileComponent extends FieldType {
  // available variables by formly: this.formControl, this.to (= this.field.templateOptions)
  @ViewChild('fileInput') fileInput: any;
  // todo: merge new files with existing files
  // files = new Set(this.to.existsFiles)
  files: Set<File> = new Set();
  formControl: FormControl;

  /*
  constructor() {
    super();
    console.log({ this: this });
  }
  */

  addFiles(): void {
    this.to.existsFiles;
    // clicks on <input #file>
    this.fileInput.nativeElement.click();
  }

  onFilesAdded(): void {
    let files: File[] = this.fileInput.nativeElement.files;
    if (this.to.multiple) {
      files.forEach((file) => this.files.add(file));
    } else {
      this.files = new Set([files[0]]);
    }
  }

  remove(file: any): void {
    this.files.delete(file);
  }

  clear(): void {
    this.files.clear();
  }
}

// ControlValueAccessor for 'file' input
// https://formly.dev/examples/other/input-file
// https://github.com/angular/angular/issues/7341
@Directive({
  selector: 'input[type=file]',
  host: {
    '(change)': 'onChange($event.target.files)',
    '(blur)': 'onTouched()',
  },
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: FileValueAccessor, multi: true },
  ],
})
export class FileValueAccessor implements ControlValueAccessor {
  value: any;
  onChange = (_: any) => {};
  onTouched = () => {};

  writeValue(value: any): any {}
  registerOnChange(fn: any): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }
}
