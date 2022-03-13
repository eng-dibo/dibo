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

import { Payload, Meta, ViewOptions } from '@engineers/ngx-content-view-mat';
import env from '../../../env';
// todo: get meta by http.get('/config/browser/meta')
import meta from '~config/browser/meta';

import {
  Component,
  OnInit,
  AfterViewInit,
  ViewChild,
  Optional,
  Inject,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { getParams, getUrl, transformData, getMetaTags } from './functions';
import { REQUEST } from '@nguniversal/express-engine/tokens';
import { PlatformService } from '@engineers/ngx-utils/platform';
import { MatDialog } from '@angular/material/dialog';
import { AppInstallDialogComponent } from '../app-install-dialog/app-install-dialog.component';
import { NotificationsDialogComponent } from '../notifications-dialog/notifications-dialog.component';

// todo: import module & interfaces from packages/content/ngx-content-view/index.ts

export interface Params {
  type: string;
  category?: string;
  item?: string;
  // pass ?refresh=auth to force refreshing the cache
  // get admin auth from ~config/server,
  // or get an auth code for each user from db
  refresh?: string;
}

@Component({
  selector: 'content-view',
  templateUrl: './view.component.html',
  styleUrls: ['./view.component.scss'],
})
export class ContentViewComponent implements OnInit, AfterViewInit {
  @ViewChild('quillView') quillView: any;
  tags!: Meta;
  options!: ViewOptions;
  categories!: Array<any>;
  category!: any;
  data!: Payload;

  // todo: share adsense by changing this value based on the article's author
  // to totally remove the adsense code in dev mode, use: <ngx-adsense *ngIf="!dev">

  constructor(
    private route: ActivatedRoute,
    private httpService: HttpClient,
    @Optional() @Inject(REQUEST) protected request: Request,
    private platform: PlatformService,
    private dialog: MatDialog
  ) {
    if (this.platform.isBrowser()) {
      window.addEventListener('beforeinstallprompt', (ev) => {
        this.showInstallDialog(ev);
      });

      // check if app already installed
      if (window.matchMedia('(display-mode: standalone)').matches) {
        this.showNotificationsDialog();
      }

      // listen to appinstalled event, this event is fired when the user install the app
      window.addEventListener('appinstalled', (evt) => {
        this.showNotificationsDialog();
      });
      // todo: listen to app uninstall event, encourage the user to reinstall it again
    }
  }

  ngOnInit(): void {
    let router = this.route.snapshot,
      params: Params = getParams(router.params, router.queryParams);

    // prevent invalid routes from requesting data from the server
    if (!['articles', 'jobs'].includes(params.type as string)) {
      throw new Error(`path not allowed: /${params.type}`);
    }

    this.httpService
      .get<Array<any>>(`${params.type}_categories`)
      .subscribe((categories) => {
        // todo: display categories list  .filter(el=>!el.parent)
        this.categories = categories;

        if (params.category) {
          let category = categories.find((el) => el.slug === params.category);
          if (category) {
            category.link = `/${params.type}/${category.slug}`;
            this.category = category;
          }
        }

        let url = getUrl(params, this.category);
        if (env.mode === 'development') {
          console.log(`[content/view] fetching from ${url}`);
        }

        this.httpService.get<Payload>(url).subscribe((data) => {
          if (typeof data === 'string') {
            data = JSON.parse(data);
          }

          this.data = transformData(data, params);

          /*
                to grt baseUrl:
                  - in browser: use location or document.baseURI
                  - in server:
                     - @Inject(DOCUMENT) -> doesn't have .baseURI (this.document.baseURI)
                     - @Inject(REQUEST) -> this.request.hostname          
              */

          // todo: get baseUrl in server & browser
          let baseUrl =
            (this.request
              ? // @ts-ignore
                `${this.request.protocol}://${this.request.hostname}`
              : '') + meta.URL || '/';

          this.tags = getMetaTags(this.data, params, { baseUrl });

          if (env.mode === 'development') {
            console.log('[content/view]', {
              data,
              params,
              tags: this.tags,
            });
          }
        });
      });

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

    // this.data$.subscribe(x => console.log("this.data:", x));
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
        console.log({ notification: Notification.permission });
      }
      if (Notification.permission === 'default') {
        console.log('requesting the permission to allow push notifications');
        this.dialog.open(NotificationsDialogComponent);
      } else if (Notification.permission === 'denied') {
        // todo: instruct the user to allow notifications
        console.error('notifications permission denied');
      }
    } else {
      console.warn("this browser doesn't support Notifications api");
    }
  }
}
