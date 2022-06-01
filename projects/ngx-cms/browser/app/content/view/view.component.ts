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
  Article,
  Meta,
  Payload,
  ViewOptions,
} from '@engineers/ngx-content-view-mat';
import environment from '../../../env';

import {
  AfterViewInit,
  Component,
  Inject,
  OnInit,
  ViewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import {
  getMetaTags,
  getParams as getParameters,
  getUrl,
  transformData,
} from './functions';
import { PlatformService } from '@engineers/ngx-utils/platform';
import { MatDialog } from '@angular/material/dialog';
import { AppInstallDialogComponent } from '../app-install-dialog/app-install-dialog.component';
import { NotificationsDialogComponent } from '../notifications-dialog/notifications-dialog.component';
import { concat } from 'rxjs';
import { toArray } from 'rxjs/operators';
import { DOCUMENT } from '@angular/common';
import { NgxLoadService } from '@engineers/ngx-utils/load-scripts.service';

// todo: import module & interfaces from packages/content/ngx-content-view/index.ts

export interface Parameters_ {
  type: string;
  postType?: string;
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
  params!: Parameters_;
  tags!: Meta;
  options!: ViewOptions;
  categories!: Array<Category>;
  itemCategories!: Array<Category>;
  data!: Payload;
  // data that fetched by loadMore()
  moreData: Article[] = [];
  limit = 10;
  offset = 0;
  // stop infiniteScroll when no more data (it already stops when the scrollbar reached the end)
  infiniteScroll = true;

  // todo: share adsense by changing this value based on the article's author
  // to totally remove the adsense code in dev mode, use: <ngx-adsense *ngIf="!dev">

  constructor(
    private router: Router,
    private httpService: HttpClient,
    private platform: PlatformService,
    private dialog: MatDialog,
    @Inject(DOCUMENT) private document: Document,
    private loadService: NgxLoadService
  ) {
    let parameters = getParameters(this.router.url.trim());
    this.params = {
      ...parameters,
      postType:
        parameters.type.slice(-1) === 's'
          ? parameters.type.slice(0, -1)
          : parameters.type,
      category: parameters.category || {},
    };

    // prevent invalid routes from requesting data from the server
    // todo: move this to contentModule (use regex for routes)
    if (!['articles', 'jobs'].includes(this.params.type)) {
      throw new Error(`[content/view] path not allowed: /${this.params.type}`);
    }

    if (this.platform.isBrowser()) {
      this.showNotificationsDialog();

      // install the app
      // todo: if notifications dialog is open, wait until it closed
      // listen to Notification.permission change
      // when the notification.permission is not granted, a notificationsDialog may be opened
      if (!Notification || Notification.permission === 'granted') {
        window.addEventListener('beforeinstallprompt', (event_) => {
          this.showInstallDialog(event_);
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
          let title = card.querySelectorAll('mat-card-title')[0],
            titleText = title.textContent,
            // todo: shorten link -> /$type/~$id
            link = title.querySelectorAll('a')[0].href;

          let url = new URL(link);
          url.pathname = url.pathname.replace(
            /([^/]+)\/[^/]+\/.+~([^/?]+)/,
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
    // todo: create route: /rss
    this.loadService.load(
      `/api/v1/rss/${this.params.type}/:100@status=approved`,
      { type: 'application/rss+xml' },
      'link'
    );

    // todo: display categories list  .filter(el=>!el.parent)

    let url = getUrl(this.params, {
      limit: this.limit,
      offset: 0,
    });

    if (environment.mode === 'development') {
      console.info(`[content/view] fetching from ${url}`);
    }

    // todo: forkJoin is better than concat here, because it runs all requests in parallel
    // but this causes an issue in the server, the function `connect()` runs for the second request
    // before it established in the first one.
    // this causes the issue `cannot perform .. before establishing the connection`

    // concat(observables).pipe(toArray()) makes a typescript issue
    // result is Array<Payload | undefined | Category[] | meta>
    // instead of Array<Payload | undefined, Category[], meta>

    concat(
      this.httpService.get<Payload | PayloadError>(url),
      this.httpService.get<Array<Category>>(`${this.params.type}_categories`),
      // todo: import(~config/..)
      this.httpService.get<Meta>('config/browser/meta')
    )
      .pipe(
        // combine all results into an array instead of emitting one by one
        toArray()
      )
      .subscribe((result: any) => {
        // todo: fix: https://stackoverflow.com/questions/71730120/type-definition-for-rxjs-concat
        // https://stackblitz.com/edit/rxjs-dqg3jk?devtoolsheight=60&file=index.ts
        let [data, categories, defaultTags]: [
          Payload | PayloadError,
          Array<Category>,
          Meta
        ] = result;
        // console.log({ data, categories, defaultTags });

        try {
          data = transformData(data as Payload, this.params, categories);

          // get category details from category.slug in url
          // if category._id couldn't be get due to an invalid category.slug is used in the url
          // for item mode, consider using item.categories[0] as category
          // use category._id for loadMore()
          if (categories) {
            this.categories = categories;
            if (!Array.isArray(data) && Array.isArray(data.categories)) {
              this.itemCategories = categories
                .filter(
                  (element: Category) =>
                    (data as Article).categories.includes(element._id) &&
                    !element.parent
                )
                .map((element: Category) => ({
                  ...element,
                  link: `/${this.params.type}/${element.slug}`,
                }));
            } else if (this.params.category?.slug) {
              let category = categories!.find(
                (element: Category) =>
                  element.slug === this.params.category!.slug
              );
              if (category) {
                this.itemCategories = [
                  {
                    ...category,
                    link: `/${this.params.type}/${category.slug}`,
                  },
                ];
              }
            }
          }

          let baseUrl = defaultTags.baseUrl || this.document.location.origin;

          this.tags = getMetaTags(
            data,
            this.params,
            Object.assign({ baseUrl }, defaultTags)
          );

          if (environment.mode === 'development') {
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
   *
   * @param ev
   * @param event_
   */
  showInstallDialog(event_: any) {
    window.addEventListener('load', () => {
      setTimeout(
        () => this.dialog.open(AppInstallDialogComponent, { data: event_ }),
        10_000
      );
    });
  }

  /**
   * display a dialog to the user to grant the permission for push notifications
   */
  showNotificationsDialog() {
    window.addEventListener('load', () => {
      if ('Notification' in window) {
        if (environment.mode === 'development') {
          console.info(
            `[content/view]: notification ${Notification.permission}`
          );
        }
        if (Notification.permission === 'default') {
          console.info(
            '[content/view] requesting the permission to allow push notifications'
          );
          // show the dialog after 10 seconds
          setTimeout(
            () =>
              this.dialog
                .open(NotificationsDialogComponent)
                .afterClosed()
                .subscribe((result) => {
                  // todo: check Notification.permission
                }),
            10_000
          );
        } else if (Notification.permission === 'denied') {
          // todo: instruct the user to allow notifications (footer)
          console.error('notifications permission denied');
        }
      } else {
        console.warn("this browser doesn't support Notifications api");
      }
    });
  }

  loadMore(): void {
    if (!Array.isArray(this.data) && this.data.error) {
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
        if (data && Array.isArray(data)) {
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
