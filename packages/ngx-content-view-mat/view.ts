import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Observable } from 'rxjs';
// todo: enable sanitizing https://www.npmjs.com/package/ngx-quill#security-hint

import { Article, ArticleOptions } from './article';
import { MetaService } from '@engineers/ngx-utils/meta.service';
import { toObservable } from '@engineers/rxjs';

/*
- usage:
<content-view [data]="{title,content,keywords[],author{},...}" [related]="[{id,title,..}]" >
*/

export type Payload = Article | Article[];

// todo: import MetaTags from meta.service
export interface Meta {
  [key: string]: any;
}

export type Type = 'list' | 'item';

export interface ViewOptions extends ArticleOptions {
  // grid || list
  layout?: string;
  // the link in case of no content
  back?: string;
  // noContent text; todo: html code
  noContent?: string;
}

export interface Board {
  message: string;
  status: 'ok' | 'error' | 'warning';
}
@Component({
  selector: 'ngx-content-view',
  templateUrl: './view.html',
  styleUrls: ['./view.scss'],
})
export class NgxContentViewComponent implements OnInit {
  // in the template, toObservable(this.data) makes the data has an observable value
  // instead of undefined, use another variable (i.e content) which guaranteed to has
  // a value only when the observable fired a value
  // otherwise you will see an error:
  // `Cannot find a differ supporting object '[object Object]' of type 'object'. NgFor only supports binding to Iterables such as Arrays.`
  // because a non-iterable value has passed to `gFor`
  @Input() data!: Payload | Observable<Payload>;
  @Input() type!: Type;
  @Input() meta!: Meta;
  @Input() options!: ViewOptions;

  // fires when the scrollbar reached 80% (up or down)
  // todo: add ngxInfiniteScroll options
  @Output() onScrollDown = new EventEmitter<void>();
  @Output() onScrollUp = new EventEmitter<void>();
  content: Payload;
  board: Board;

  constructor(private metaService: MetaService) {}

  ngOnInit(): void {
    this.options = Object.assign(
      {
        // todo: use <{{options.titleTag}}>{{data.title}}</>
        titleTag: this.type === 'item' ? 'h1' : 'h3',
        // todo: options.back=/$item.categories[0]
        back: '/',
      },
      this.options || {}
    );

    toObservable(this.data).subscribe(
      (data: Payload) => {
        this.type = data instanceof Array ? 'list' : 'item';
        this.content = data;
      },

      (error) => {
        this.board = {
          status: 'error',
          message:
            ((typeof error === 'string' ? error : error.message) || 'error!') +
            `<br /><a href="/">go to homepage</a>`,
        };
      }
    );
  }

  ngOnChanges(changes: any): void {
    if (changes.meta) {
      // addTags() may causes duplication
      // The Meta tags are equal only if values of all the attributes are equal
      // updateTags() inserts the tag if matching meta element is not found
      // updateTag() replaces only the first instance of the search criteria
      // https://www.tektutorialshub.com/angular/meta-service-in-angular-add-update-meta-tags-example/
      this.metaService.updateTags(this.meta as Meta);
    }
  }
}
