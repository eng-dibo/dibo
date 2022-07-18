import { Component, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { FormlyFieldConfig } from '@ngx-formly/core';
import { PlatformService } from '@engineers/ngx-utils/platform';
import { Title } from '@angular/platform-browser';

export interface Response {
  status?: 'ok' | 'error' | 'loading';
  message?: string;
  class?: string | string[] | Set<string> | { [className: string]: boolean };
}

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
/**
 * login or register a user
 * see content/editor
 */
export class LoginComponent implements OnInit {
  formGroup = new FormGroup({});
  fields: FormlyFieldConfig[];
  model: { [key: string]: any } = {};
  response: Response = { status: undefined };
  step: 'init' | 'login' | 'register' | 'finished' = 'init';

  constructor(private titleService: Title, private platform: PlatformService) {
    this.titleService.setTitle('members area');
  }

  ngOnInit(): void {
    if (this.platform.isBrowser() && sessionStorage) {
      let authToken = sessionStorage.getItem('authToken');
      if (authToken) {
        this.response = { status: 'error', message: 'already logged in' };
        // location.href = '/';
      } else {
        this.fields = [
          {
            // todo: validation
            key: 'entry',
            type: 'input',
            templateOptions: {
              label: 'email or mobile',
              description:
                'enter your email, or your mobile with the country code',
              addonLeft: {
                class: 'fa fa-euro',
              },
              required: true,
            },
          },
        ];
      }
    }
  }

  onNext(): void {
    if (!this.formGroup || !this.formGroup.value) {
      this.response = {
        status: 'error',
        message: 'technical error: `formGroup` is undefined',
      };
      return;
    }

    let data = this.formGroup.value;

    if (!data.entry) {
      this.response = {
        status: 'error',
        message: 'enter your email or mobile number',
      };
      return;
    }

    console.log({ data });

    //todo: check if the entry existing
    let isEntryExisting = true;

    if (isEntryExisting) {
      // login
      this.fields = [
        ...this.fields,
        {
          key: 'password',
          type: 'input',
          templateOptions: {
            type: 'password',
            label: 'password',
            required: true,
            minLength: 6,
          },
        },
      ];

      this.step = 'login';
    } else {
      // register
    }
  }

  onSubmit(): void {
    let data = this.formGroup.value;
    console.log({ step: this.step, data });

    if (data.entry === 'xx' && data.password === '123456') {
      this.step = 'finished';
      this.response = { status: 'ok', message: 'logged in successfully' };
      this.fields = [];
    }
  }
}
