/**
 * get type from params (articles or jobs), and then retrieve data$ from the server,
 * then display it in the browser
 *
 * todo:
 *  - if(!job.open | article.expire)show warning & disable apply btn (for jobs)
 *  - if(job) add fields (ex: contacts, salary, ..), add apply btn
 *  - add copy btn to each post
 *  - add copy-all btn to index (or category) page (*ngIf=data.type=list){show ctg.title; add copy-all btn}
 */

import { Payload, Meta } from '@engineers/ngx-content-view-mat';
import { MetaService } from '@engineers/ngx-utils/meta.service';
import { ADSENSE } from '~config/browser';
import env from '~config/env';

import {
  Component,
  OnInit,
  AfterViewInit,
  ElementRef,
  ViewChild,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { map, concatMap } from 'rxjs/operators';
import { urlParams } from '@engineers/ngx-utils/router';
import { NgxLoadService } from '@engineers/ngx-utils/load-scripts.service';
import { HttpClient } from '@angular/common/http';
import { getParams, getUrl, transformData, getMetaTags } from './functions';

// todo: import module & interfaces from packages/content/ngx-content-view/index.ts

export interface Params {
  category: string | null;
  id?: string | null;
  // pass ?refresh=auth to force refreshing the cache
  // get admin auth from ~config/server,
  // or get an auth code for each user from db
  refresh?: string | null;
  type?: string;
  [key: string]: any;
}

@Component({
  selector: 'content-view',
  templateUrl: './view.component.html',
  styleUrls: ['./view.component.scss'],
})
export class ContentViewComponent implements OnInit, AfterViewInit {
  @ViewChild('quillView') quillView: any;
  data$!: Observable<Payload>;
  tags!: Meta;
  options = { layout: 'grid' };
  // use the definite assignment assertion "!" when tsconfig.strictPropertyInitialization
  // if a property in the constructor() will be assigned to a value later (i.e outside of the constructor)
  // https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-7.html#strict-class-initialization
  params!: Params;

  // todo: share adsense by changing this value based on the article's author
  // to totally remove the adsense code in dev mode, use: <ngx-adsense *ngIf="!dev">

  constructor(
    private route: ActivatedRoute,
    private httpService: HttpClient,
    private loadService: NgxLoadService
  ) {}

  ngOnInit(): void {
    this.data$ = urlParams(this.route).pipe(
      map(([params, query]) => {
        this.params = getParams(params, query);
        if (env.mode === 'development') {
          console.log({ params, query, result: this.params });
        }
        return this.params;
      }),
      // we use concatMap here instead of map because it emits Observable (this.getData())
      // so we flatten the inner Obs. i.e: it subscribes to the inner Obs. (this.getData) instead of the outer one (urlParams())
      // also we use concatMap and not mergeMap, to wait until the previous Obs. to be completed.
      concatMap((params) => this.httpService.get<Payload>(getUrl(params))),
      map((data) => {
        let content = transformData(data, this.params);
        this.tags = getMetaTags(content, this.params);
        return content;
      })
    );

    // this.data$.subscribe(x => console.log("this.data:", x));
  }
  ngAfterViewInit(): void {
    // todo: use HighlightJS for `<code>..</code>`

    // todo: adsense profit sharing
    this.loadService.load(
      '//pagead2.googlesyndication.com/pagead/js/adsbygoogle.js',
      { 'data-ad-client': ADSENSE }
    );
  }
}
