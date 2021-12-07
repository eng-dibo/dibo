import { Component, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { FormlyFieldConfig } from '@ngx-formly/core';

@Component({
  selector: 'content-editor',
  templateUrl: './editor.component.html',
  styleUrls: ['./editor.component.scss'],
})
export class ContentEditorComponent implements OnInit {
  control = new FormGroup({});
  fields: FormlyFieldConfig[] = [
    {
      key: 'title',
      type: 'input',
      templateOptions: {
        label: 'Title',
      },
    },
  ];
  // holds arbitrary data
  model: { [key: string]: any } = {};
  constructor() {}

  ngOnInit(): void {}
}
