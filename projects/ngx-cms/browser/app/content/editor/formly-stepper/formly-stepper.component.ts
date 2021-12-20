import { Component, Input, OnInit } from '@angular/core';
import { FieldType } from '@ngx-formly/material';
import { FormlyFieldConfig } from '@ngx-formly/core';

@Component({
  selector: 'app-formly-stepper',
  templateUrl: './formly-stepper.component.html',
  styleUrls: ['./formly-stepper.component.scss'],
})
export class FormlyStepperComponent extends FieldType {
  isValid(field: FormlyFieldConfig): boolean {
    if (field.formControl) {
      return field.formControl.valid;
    } else if (field.fieldGroup) {
      return field.fieldGroup.every((f) => this.isValid(f));
    }

    return false;
  }
}
