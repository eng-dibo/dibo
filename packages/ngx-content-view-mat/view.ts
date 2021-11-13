import { Component, Input, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
// todo: enable sanitizing https://www.npmjs.com/package/ngx-quill#security-hint
import { QuillViewComponent } from 'ngx-quill';

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
  content: Payload;

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

    toObservable(this.data).subscribe((data: Payload) => {
      // todo: if (typeof data == "string") data = JSON.parse(data);

      this.metaService.setTags(this.meta as Meta);
      this.type = data instanceof Array ? 'list' : 'item';
      this.content = data;
    });
  }
}
