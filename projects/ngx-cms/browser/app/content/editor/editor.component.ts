import { Component, OnInit, ViewChild, TemplateRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Observable, of, forkJoin } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Article } from '@engineers/ngx-content-view-mat';
import basicArticleFields from './article-fields';
import { FormGroup } from '@angular/forms';
import { FormlyFieldConfig } from '@ngx-formly/core';
import { map } from 'rxjs/operators';

export interface Params {
  type: string;
  id: string | null;
  postType?: string;
}

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
export class ContentEditorComponent implements OnInit {
  params!: Params;
  formGroup = new FormGroup({});
  fields: FormlyFieldConfig[];
  // holds arbitrary data
  model: { [key: string]: any } = {};
  response: Response = { status: undefined };
  cache: { [key: string]: any } = {};

  // file-upload vars:
  // access #file DOM element
  @ViewChild('file') file: any;
  // Set<File> = new Set();
  files = [];
  progress!: Progress;
  @ViewChild('buttons') buttonsTemplate: TemplateRef<any>;

  // todo: hide this route (/editor) from search engines

  constructor(
    private route: ActivatedRoute,
    private httpService: HttpClient,
    private snackBar: MatSnackBar
  ) {
    // todo: use snapshot
    this.route.paramMap.subscribe((params) => {
      let type = params.get('type') || 'articles';
      this.params = {
        id: params.get('item'),
        type,
        // convert articles to article, jobs to job
        postType: type.slice(-1) === 's' ? type.slice(0, -1) : type,
      };
    });
  }

  ngOnInit(): void {
    this.response.status = 'loading';
    forkJoin([this.getData<Article>(), this.getCategories()]).subscribe(
      ([data, categories]) => {
        this.model = data;

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
                      data: categories,
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
   * @returns
   */
  getData<T>(): Observable<T> {
    return this.getCache<T>(
      'data',
      this.params.id
        ? this.httpService.get<T>(`/${this.params.type}/${this.params.id}`)
        : of({})
    );
  }

  getCategories(): Observable<any> {
    return this.getCache<any>(
      'categories',
      this.httpService.get<any>('/articles_categories')
    );
  }

  getArticleFields() {
    if (!this.cache.articleFields) {
      let articleFields = ([] as typeof basicArticleFields).concat(
        basicArticleFields
      );
      if (this.params.type === 'jobs') {
        /*
    //delete cover image since jobs.layout=="list" not grid
    //dont use delete article.fields(...)
    articleForm.splice(
      articleForm.findIndex(el => el.type == "file"),
      1
    );*/

        // add field:contacts after content
        articleFields.splice(
          articleFields.findIndex((el: any) => el.key === 'content') + 1,
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
        .filter((el) => !['subtitle', 'slug'].includes(el.key as string))
        .map((el) => {
          if (!el.templateOptions) {
            el.templateOptions = {};
          }
          if (!el.templateOptions.label) {
            el.templateOptions.label = el.key as string;
          }

          if (this.params.type === 'articles' && el.key === 'content') {
            el.type = 'quill';
            el.templateOptions.modules = {
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
              // ,syntax: true //->install highlight.js or ngx-highlight
            };
          }

          return el;
        });
    }
    return this.cache.articleFields;
  }

  onSubmit(stepper: any): void {
    // todo: data.files=this.upload() or: submit().subscribe(data=>upload())
    // todo: data.files= {cover: #cover.files.data}
    // todo: send base64 data from data.content to firebase storage
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
    data._id = this.params.id;
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
