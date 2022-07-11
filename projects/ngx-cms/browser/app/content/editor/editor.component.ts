import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, of } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Article } from '@engineers/ngx-content-view-mat';
import basicArticleFields from './article-fields';
import { FormGroup } from '@angular/forms';
import { FormlyFieldConfig } from '@ngx-formly/core';
import { map } from 'rxjs/operators';
import Quill from 'quill';
// @ts-ignore: Could not find a declaration file
import QuillMarkdown from 'quilljs-markdown';
import dompurify from 'dompurify';
import { getParams } from '~browser/app/content/view/functions';
import { Params } from '~browser/app/content/view/view.component';

export interface Progress {
  loaded: number;
  total?: number;
}

export interface Response {
  // set status=undefined to just clear the response area
  status?: 'ok' | 'error' | 'loading';
  message?: string;
  class?: string | string[] | Set<string> | { [className: string]: boolean };
}

@Component({
  selector: 'app-content-editor',
  templateUrl: './editor.component.html',
  styleUrls: ['./editor.component.scss'],
})
export class ContentEditorComponent {
  params!: Params;
  formGroup = new FormGroup({});
  fields: FormlyFieldConfig[];
  // holds arbitrary data
  model: { [key: string]: any } = {};
  response: Response = { status: undefined };
  cache: { [key: string]: any } = {};

  // file-upload variables:
  // access #file DOM element
  @ViewChild('file') file: any;
  // todo: Set<File> = new Set();
  files = [];
  progress!: Progress;
  @ViewChild('buttons') buttonsTemplate: TemplateRef<any>;

  // todo: hide this route (/editor) from search engines
  // todo: use client-side rendering, no need for SSR here

  constructor(
    private router: Router,
    private httpService: HttpClient,
    private snackBar: MatSnackBar
  ) {
    let parameters = getParams(this.router.url.trim());
    this.params = {
      ...parameters,
      postType:
        parameters.type.slice(-1) === 's'
          ? parameters.type.slice(0, -1)
          : parameters.type,
      category: parameters.category || {},
    };
  }

  // a temporary workaround about the issue: `ViewChild` not available in `ngOnInit`
  // makes buttonsTemplate=undefined so, 'next' and 'previous' buttons don't displayed in the stepper component
  // https://github.com/ngx-formly/ngx-formly/issues/3375
  ngAfterViewInit(): void {
    this.response.status = 'loading';
    forkJoin([this.getData<Article>(), this.getCategories()]).subscribe(
      ([data, categories]) => {
        this.model = data.payload;

        this.fields = [
          {
            type: 'stepper',
            templateOptions: {
              buttonsTemplate: this.buttonsTemplate,
            },
            fieldGroup: [
              {
                templateOptions: {
                  label: `${this.params.postType} content`,
                },
                fieldGroup: this.getArticleFields(),
              },
              {
                templateOptions: { label: `categories` },
                fieldGroup: [
                  {
                    key: 'categories',
                    // todo: create type `categories` that creates checkbox inputs tree to select categories
                    type: 'categories',
                    // formControl: new FormControl([]),
                    templateOptions: {
                      data: categories.payload || [],
                      color: 'primary',
                    },
                  },
                ],
              },
            ],
          },
        ];
        this.response.status = undefined;
      }
    );
  }

  move(direction: 'next' | 'previous', stepper: any) {
    if (direction === 'next') {
      stepper.next();
    } else if (direction === 'previous') {
      stepper.previous();
    }
  }

  isValid(field: FormlyFieldConfig): boolean {
    if (field.formControl) {
      return field.formControl.valid;
    } else if (field.fieldGroup) {
      return field.fieldGroup.every((f) => this.isValid(f));
    }

    return false;
  }

  /**
   * get data from the cache if existing, or update the cache key
   *
   * @param key
   * @param query
   * @returns
   */
  getCache<T>(key: string, query: Observable<any>): Observable<T> {
    return this.cache[key]
      ? of(this.cache[key])
      : query.pipe(
          map((result) => {
            this.cache[key] = result;
            return result;
          })
        );
  }

  /**
   * fetches data from the server
   * it caches the result so it doesn't have to perform the operation every time
   *
   * @returns
   */
  getData<T>(): Observable<T> {
    return this.getCache<T>(
      'data',
      this.params.item
        ? this.httpService.get<T>(`/${this.params.type}/${this.params.item}`)
        : of({})
    );
  }

  getCategories(): Observable<{ payload: Array<any>; next: string }> {
    return this.getCache<any>(
      'categories',
      this.httpService.get<any>(
        `/${this.params.type === 'jobs' ? 'jobs' : 'articles'}_categories`
      )
    );
  }

  getArticleFields() {
    if (!this.cache.articleFields) {
      let articleFields = ([] as typeof basicArticleFields).concat(
        basicArticleFields
      );
      if (this.params.type === 'jobs') {
        // todo: replace 'content' with 'Advantages', 'conditions'
        /*
    //delete cover image since jobs.layout=="list" not grid
    //don't use delete article.fields(...)
    articleForm.splice(
      articleForm.findIndex(el => el.type == "file"),
      1
    );*/

        // add field:contacts after content
        articleFields.splice(
          articleFields.findIndex((element: any) => element.key === 'content') +
            1,
          0,
          {
            key: 'contacts',
            type: 'textarea',
            templateOptions: {
              rows: 2,
            },
          },
          {
            key: 'location',
            type: 'input',
            templateOptions: {
              description: 'country or city or full address',
            },
          }
        );

        // todo: add fields: required experience, salary,
        // job type (ex: full time), location{}, company{}, required skills,
        // application deadline (date), ..

        // todo: categories = sub of jobs, main category = jobs

        // todo: if(form.content contains contacts)error -> email, mobile, link
      } else {
        // change content.type from textarea to quill
      }

      this.cache.articleFields = articleFields
        .filter(
          (element) => !['subtitle', 'slug'].includes(element.key as string)
        )
        .map((element) => {
          if (!element.templateOptions) {
            element.templateOptions = {};
          }
          if (!element.templateOptions.label) {
            element.templateOptions.label = element.key as string;
          }

          if (this.params.type === 'articles' && element.key === 'content') {
            //  todo: this causes `document not defined` error even when wrapping it with `if(platform.isBrowser())`
            //  Quill.register({ 'modules/QuillMarkdown': QuillMarkdown }, true);

            element.type = 'quill';
            element.templateOptions.modules = {
              toolbar: [
                ['bold', 'italic', 'underline', 'strike'],
                ['blockquote', 'code-block'],
                [{ header: [false, 2, 3, 4] }],
                [{ list: 'ordered' }, { list: 'bullet' }],
                [{ script: 'sub' }, { script: 'super' }],
                [{ direction: ['rtl', 'ltr'] }],
                [{ size: ['small', false, 'large'] }],
                [{ color: [] }, { background: [] }],
                [{ align: [] }],
                ['link', 'image', 'video'],
                ['clean'],
              ],
              // todo: `#` -> h2 (instead of h1)
              QuillMarkdown: {},
              // ,syntax: true //->install highlight.js or ngx-highlight
            };
            // todo: html description
            // '<a href="https://www.markdownguide.org/">markdown</a> is supported'
            element.templateOptions.description = 'markdown is supported';
          }

          return element;
        });
    }
    return this.cache.articleFields;
  }

  onSubmit(stepper: any): void {
    // todo: data.files=this.upload() or: submit().subscribe(data=>upload())
    // todo: data.files= {cover: #cover.files.data}
    // todo: send base64 data from data.content to gcloud storage
    // this.form = form;

    this.response = {
      status: 'loading',
    };

    if (!this.formGroup || !this.formGroup.value) {
      this.response = {
        status: 'error',
        message: 'technical error: `formGroup` is undefined',
      };

      return;
    }

    let data = this.formGroup.value;
    if (this.params.item) {
      data._id = this.params.item;
    }
    // DOMPurify sanitizes HTML and prevents XSS attacks
    // also remove unwanted attributes and values
    // example: <div class="unwanted" unwanted="">
    // https://github.com/cure53/DOMPurify#can-i-configure-dompurify
    // todo: validate html code
    data.content = dompurify().sanitize(data.content, {
      KEEP_CONTENT: false,
      FORBID_TAGS: ['script', 'style', 'html', 'head', 'body', 'meta'],
      FORBID_ATTR: ['class', 'id'],
      IN_PLACE: true,
    });
    // todo: subscribe to progress events
    let url = `/${this.params.type}`;
    this.httpService
      .post<any>(url, data, {
        reportProgress: true,
        headers: { toFormData: 'true' },
      })
      .subscribe((result) => {
        // todo: show progress bar

        if (!result) {
          this.response = {
            status: 'error',
            message: 'no data',
          };
        } else {
          this.response = result.error
            ? {
                status: 'error',
                message: result.error.message,
              }
            : {
                status: 'ok',
                message: result._id
                  ? `${this.params.postType} posted successfully,
                    <a href="${this.params.type}/~${result._id}">view</a><br />
                    <a href="${this.params.type}/editor">post another ${this.params.postType}</a>
                    `
                  : '',
              };
        }

        // todo: display html inside showSnackBar, or convert the html message into plain text
        this.snackBar.open(
          (this.response.status === 'ok' ? 'form submitted' : 'error') +
            /* this.response.message ||*/ '',
          'close',
          { duration: 7000 }
        );

        // this.uploadedFiles=event.body;

        this.formGroup.reset();
        // reset the stepper to the first step
        stepper.selectedIndex = 0;

        // todo: fix: this.formComp.formElement.reset is not a function
        // this.formComp.formElement.reset();
        // https://stackoverflow.com/a/49789012/12577650; also see create.html
        // this.files.clear();
        this.files = [];
        // todo: reset progress value
      });
  }
}
