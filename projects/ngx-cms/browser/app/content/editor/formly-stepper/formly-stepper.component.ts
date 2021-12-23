import { Component } from '@angular/core';
import { FieldType } from '@ngx-formly/material';

@Component({
  selector: 'app-formly-stepper',
  templateUrl: './formly-stepper.component.html',
  styleUrls: ['./formly-stepper.component.scss'],
})
export class FormlyStepperComponent extends FieldType {}
