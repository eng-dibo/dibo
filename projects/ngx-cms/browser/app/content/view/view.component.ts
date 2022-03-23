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

import {
  Payload,
  Meta,
  ViewOptions,
  Article,
} from '@engineers/ngx-content-view-mat';
import env from '../../../env';

import {
  Component,
  OnInit,
  AfterViewInit,
  ViewChild,
  Inject,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { getParams, getUrl, transformData, getMetaTags } from './functions';
import { PlatformService } from '@engineers/ngx-utils/platform';
import { MatDialog } from '@angular/material/dialog';
import { AppInstallDialogComponent } from '../app-install-dialog/app-install-dialog.component';
import { NotificationsDialogComponent } from '../notifications-dialog/notifications-dialog.component';
import { forkJoin } from 'rxjs';
import { DOCUMENT } from '@angular/common';
import { NgxLoadService } from '@engineers/ngx-utils/load-scripts.service';

// todo: import module & interfaces from packages/content/ngx-content-view/index.ts

export interface Params {
  type: string;
  postType: string;
  category?: Category;
  item?: string;
  // todo: pass ?refresh=auth to force refreshing the cache
  // get admin auth from ~config/server,
  // & get an auth code for each user from db
  refresh?: string;
}

export interface PayloadError {
  error: string;
}

export interface Category {
  _id?: string;
  title?: string;
  slug?: string;
  [key: string]: any;
}
@Component({
  selector: 'content-view',
  templateUrl: './view.component.html',
  styleUrls: ['./view.component.scss'],
})
export class ContentViewComponent implements OnInit, AfterViewInit {
  @ViewChild('quillView') quillView: any;
  params!: Params;
  tags!: Meta;
  options!: ViewOptions;
  categories!: Array<Category>;
  data!: Payload;
  // data that fetched by loadMore()
  moreData: Article[] = [];
  limit: number = 10;
  offset: number = 0;
  // stop infiniteScroll when no more data (it already stops when the scrollbar reached the end)
  infiniteScroll = true;

  // todo: share adsense by changing this value based on the article's author
  // to totally remove the adsense code in dev mode, use: <ngx-adsense *ngIf="!dev">

  constructor(
    private route: ActivatedRoute,
    private httpService: HttpClient,
    private platform: PlatformService,
    private dialog: MatDialog,
    @Inject(DOCUMENT) private document: Document,
    private loadService: NgxLoadService
  ) {
    if (this.platform.isBrowser()) {
      this.showNotificationsDialog();

      // install the app
      // todo: if notifications dialog is open, wait until it closed
      // listen to Notification.permission change
      // when the notification.permission is not granted, a notificationsDialog may be opened
      if (!Notification || Notification.permission === 'granted') {
        window.addEventListener('beforeinstallprompt', (ev) => {
          this.showInstallDialog(ev);
        });
      }

      // check if app already installed
      // if (window.matchMedia('(display-mode: standalone)').matches) { }

      // this event is fired when the user install the app
      // window.addEventListener('appinstalled', (evt) => { });

      // todo: listen to app uninstall event, encourage the user to reinstall it again
    }

    this.options = {
      layout: 'grid',
      copyAction: (card: any): string | undefined => {
        // for jobs, override the default copied data
        if (location.pathname.split(/\//)[1] === 'jobs') {
          let title = card.getElementsByTagName('mat-card-title')[0],
            titleText = title.textContent,
            // todo: shorten link -> /$type/~$id
            link = title.getElementsByTagName('a')[0].href;

          let url = new URL(link);
          url.pathname = url.pathname.replace(
            /([^\/]+)\/(?:[^\/]+)\/.+~([^\/?]+)/,
            '$1/~$2'
          );
          link = url.href;

          return `${titleText}\n${link}`;
        }
        return;
      },
    };
  }

  ngOnInit(): void {
    this.params = getParams(this.route.snapshot);
    // todo: create route: /rss
    this.loadService.load(
      `/api/v1/rss/${this.params.type}/:100@status=approved`,
      { type: 'application/rss+xml' },
      'link'
    );

    // prevent invalid routes from requesting data from the server
    // todo: move this to contentModule (use regex for routes)
    if (!['articles', 'jobs'].includes(this.params.type)) {
      throw new Error(`path not allowed: /${this.params.type}`);
    }

    // todo: display categories list  .filter(el=>!el.parent)

    let url = getUrl(this.params, {
      limit: this.limit,
      offset: 0,
    });

    if (env.mode === 'development') {
      console.info(`[content/view] fetching from ${url}`);
    }

    forkJoin([
      this.httpService.get<Payload | PayloadError>(url),
      this.httpService.get<Array<Category>>(`${this.params.type}_categories`),
      this.httpService.get<Meta>('config/browser/meta'),
    ]).subscribe(([data, categories, defaultTags]) => {
      try {
        this.categories = categories;
        data = transformData(data as Payload, this.params, categories);

        // get category details from category.slug in url

        if (this.params.category && this.params.category.slug) {
          let category = categories.find(
            (el) => el.slug === this.params.category!.slug
          );

          if (category) {
            this.params.category = category;
            this.params.category.link = `/${this.params.type}/${this.params.category.slug}`;
          }
        }

        // if category._id couldn't be get due to an invalid category.slug is used in the url
        // for item mode, consider using item.categories[0] as category
        // use category._id for loadMore()
        if (
          !this.params.category!._id &&
          !(data instanceof Array) &&
          data.categories instanceof Array
        ) {
          let category = categories.find(
            (el) => el._id === (data as Article).categories[0]
          );

          if (category) {
            this.params.category = category;
            this.params.category.link = `/${this.params.type}/${this.params.category.slug}`;
          }
        }

        let baseUrl = defaultTags.baseUrl || this.document.location.origin;

        this.tags = getMetaTags(
          data,
          this.params,
          Object.assign({ baseUrl }, defaultTags)
        );

        if (env.mode === 'development') {
          console.info('[content/view]', {
            params: this.params,
            data,
            defaultTags,
            tags: this.tags,
          });
        }
        this.data = data;
      } catch (error) {
        this.data = { error };
        throw error;
      }
    });
  }
  ngAfterViewInit(): void {
    // todo: use HighlightJS for `<code>..</code>`
  }

  /**
   * display a dialog to the user to install the PWA app
   */
  showInstallDialog(ev: any) {
    this.dialog.open(AppInstallDialogComponent, { data: ev });
  }

  /**
   * display a dialog to the user to grant the permission for push notifications
   */
  showNotificationsDialog() {
    if ('Notification' in window) {
      if (env.mode === 'development') {
        console.info(`[content/view]: notification ${Notification.permission}`);
      }
      if (Notification.permission === 'default') {
        console.info(
          '[content/view] requesting the permission to allow push notifications'
        );
        this.dialog
          .open(NotificationsDialogComponent)
          .afterClosed()
          .subscribe((result) => {
            // todo: check Notification.permission
          });
      } else if (Notification.permission === 'denied') {
        // todo: instruct the user to allow notifications (footer)
        console.error('notifications permission denied');
      }
    } else {
      console.warn("this browser doesn't support Notifications api");
    }
  }

  loadMore(): void {
    if (!(this.data instanceof Array) && this.data.error) {
      this.infiniteScroll = false;
    }
    if (!this.infiniteScroll) {
      return;
    }

    this.offset += this.limit;
    this.httpService
      .get<Article[] | PayloadError>(
        // remove params.item to fetch articles by category
        getUrl(Object.assign({}, this.params, { item: undefined }), {
          offset: this.offset,
          limit: this.limit,
        })
      )
      .subscribe((data) => {
        if (data && data instanceof Array) {
          this.moreData.push(
            ...(transformData(
              data as unknown as Article[],
              this.params,
              this.categories
            ) as Article[])
          );
        } else {
          this.infiniteScroll = false;
        }
      });
  }

  follow(): void {}
}
