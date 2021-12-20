import {
  Component,
  OnInit,
  ViewChild,
  SimpleChanges,
  OnChanges,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { HttpEvent, HttpEventType } from '@angular/common/http';
import { Observable, of, forkJoin } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Article } from '@engineers/ngx-content-view-mat';
import { HighlightJS } from 'ngx-highlightjs';
import basicArticleFields from './article-fields';
import { FormGroup } from '@angular/forms';
import { FormlyFieldConfig, FormlyFormOptions } from '@ngx-formly/core';
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
export class ContentEditorComponent implements OnInit, OnChanges {
  params!: Params;
  control = new FormGroup({});
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

  // todo: hide this route (/editor) from search engines

  constructor(
    private route: ActivatedRoute,
    private httpService: HttpClient,
    private snackBar: MatSnackBar,
    private hljs: HighlightJS
  ) {
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
            fieldGroup: [
              {
                templateOptions: { label: `${this.params.postType} content` },
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

  /**
   * get data from the cache if existing, or update the cache key
   * @param key
   * @param query
   * @returns
   */
  getCache(key: string, query: Observable<any>) {
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
    return this.getCache(
      'data',
      this.params.id
        ? this.httpService.get<T>(`/${this.params.type}/${this.params.id}`)
        : of({})
    );
  }

  getCategories(): Observable<any> {
    return this.getCache(
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

  ngOnChanges(changes: SimpleChanges): void {
    if ('response' in changes && changes.response.currentValue) {
      let resp = changes.response.currentValue;

      this.response.class = {
        [`alert-${resp.status === 'loading' ? 'warning' : resp.status}`]: true,
      };

      if (!this.response.message) {
        this.response.message =
          resp.status === 'ok'
            ? 'Form submitted successfully'
            : resp.status === 'error'
            ? 'Error'
            : 'Loading....';
      }
    }
  }

  onSubmit(control: FormGroup): void {
    // todo: data.files=this.upload() or: submit().subscribe(data=>upload())
    // todo: data.files= {cover: #cover.files.data}
    // todo: send base64 data from data.content to firebase storage
    // this.form = form;

    this.response = {
      status: 'loading',
    };

    if (!this.control || !this.control.value) {
      this.response = {
        status: 'error',
        message: 'technical error: `form` is undefined',
      };

      return;
    }

    let data = this.control.value;
    data._id = this.params.id;
    // todo: control.get('cover').files?
    let files = this.fields!.filter((el: any) => el.type === 'file');
    // todo: subscribe to progress events
    let url = '';
    this.httpService
      .post<any>(url, data, { reportProgress: true })
      .subscribe((event: HttpEvent<any>) => {
        if (event.type === HttpEventType.UploadProgress) {
          this.progress = { loaded: event.loaded, total: event.total };
        }
        // todo: send to formObj$.fields[type=file]
        else if (event.type === HttpEventType.Response) {
          let _data = event.body;

          if (!_data) {
            this.response = {
              status: 'error',
              message: 'no data',
            };
          } else {
            this.response = _data.error
              ? {
                  status: 'error',
                  message: _data.error.message,
                }
              : {
                  status: 'ok',
                  message: _data._id
                    ? `${this.params.postType} posted successfully,
                    <a href="${this.params.type}/item/${_data._id}">view</a><br />
                    <a href="${this.params.type}/editor">post another ${this.params.postType}</a>
                    `
                    : '',
                };
          }

          // todo: reset progress value
          // todo: showSnackBar() content: is html
          this.showSnackBar(
            (this.response.status === 'ok' ? 'form submitted' : 'error') +
              this.response.message || '',
            'close',
            7000
          );
          // this.uploadedFiles=event.body;
          this.control.reset();

          // todo: fix: this.formComp.formElement.reset is not a function
          //  this.formComp.formElement.reset(); //https://stackoverflow.com/a/49789012/12577650; also see create.html
          //  this.files.clear();
          this.files = [];
        }
      });
  }

  showSnackBar(message: string, action: string, duration = 0): void {
    this.snackBar.open(message, action, { duration });
  }
}
