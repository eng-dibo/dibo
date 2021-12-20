/**
 * a sample form for creating articles
 * import and modify it to fit your model
 */

import { FieldType, FormlyFieldConfig } from '@ngx-formly/core';
let fields: FormlyFieldConfig[] = [
  {
    key: 'title',
    type: 'input',
    templateOptions: {
      description: '50~200 characters',
      required: true,
      maxLength: 200,
      minLength: 50,
      // todo: remove special chars (use Regex)
    },
  },
  {
    key: 'subtitle',
    type: 'input',
    templateOptions: {
      maxLength: 200,
    },
  },
  {
    key: 'slug',
    type: 'input',
    templateOptions: {
      maxLength: 200,
      description: '50~200 characters',
    },
  },
  {
    key: 'content',
    type: 'textarea',
    templateOptions: {
      required: true,
      rows: 10,
    },
  },
  {
    key: 'keywords',
    type: 'input',
    templateOptions: {
      description: 'search terms',
    },
  },
  {
    key: 'sources',
    type: 'textarea',
    templateOptions: {
      description: 'article sources',
      rows: 10,
    },
  },
  {
    key: 'cover',
    // you need to register the type 'file' to formlyModule or remove this field
    type: 'file',
    templateOptions: {
      label: 'Cover image',
      multiple: false,
      accept: 'image/*',
    },
  },
];
export default fields;
