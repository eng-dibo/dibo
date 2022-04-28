import { Component } from '@angular/core';
import { FormlyFieldConfig } from '@ngx-formly/core';
import { FormGroup } from '@angular/forms';
import { Response } from '~browser/app/content/editor/editor.component';

@Component({
  selector: 'members-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class MembersLoginComponent {
  fields: FormlyFieldConfig[];
  formGroup = new FormGroup({});
  model: { [key: string]: any } = {};
  response: Response = { status: undefined };

  ngOnInit() {
    this.fields = [
      {
        // todo: add validation
        key: 'entry',
        type: 'input',
        templateOptions: {
          label: 'email or mobile number including the country code',
        },
      },
    ];
  }

  onSubmit() {}
}
