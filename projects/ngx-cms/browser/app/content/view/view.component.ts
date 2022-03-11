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
import { Observable } from 'rxjs';
import { map, concatMap } from 'rxjs/operators';
import { urlParams } from '@engineers/ngx-utils/router';
import { HttpClient } from '@angular/common/http';
import { getParams, getUrl, transformData, getMetaTags } from './functions';
import { REQUEST } from '@nguniversal/express-engine/tokens';
import { PlatformService } from '@engineers/ngx-utils/platform';
import { MatDialog } from '@angular/material/dialog';
import { AppDialogComponent } from '../app-dialog/app-dialog.component';
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
  data$!: Observable<Payload>;
  tags!: Meta;
  options = {
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
  // use the definite assignment assertion "!" when tsconfig.strictPropertyInitialization
  // if a property in the constructor() will be assigned to a value later (i.e outside of the constructor)
  // https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-7.html#strict-class-initialization
  params!: Params;

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
      concatMap(
        (params) => {
          // prevent old routes format from making any request
          // old route: /$id-$slug
          // new route: /$type/$slug~$id
          if (!['articles', 'jobs'].includes(params.type as string)) {
            throw new Error(`path not allowed: /${params.type}`);
          }
          let url = getUrl(params);
          if (env.mode === 'development') {
            console.log(`[content/view] fetching from ${url}`);
          }
          return this.httpService.get<Payload>(url);
        }
        // old data routes doesn't start with articles|jobs which causes creating arbitrary collections in the database
        // example: /${id}-${slug} instead of /articles/${slug}-${id}
      ),
      map((data) => {
        if (typeof data === 'string') {
          data = JSON.parse(data);
        }

        let content = transformData(data, this.params);
        if (this.platform.isServer() && this.request) {
          // set met tags in server only, no need to re-set them again in the browser
          /*
            to grt baseUrl:
              - in browser: use location or document.baseURI
              - in server:
                 - @Inject(DOCUMENT) -> doesn't have .baseURI (this.document.baseURI)
                 - @Inject(REQUEST) -> this.request.hostname          
          */
          // @ts-ignore
          let baseUrl = `${this.request.protocol}://${this.request.hostname}${
            meta.URL || '/'
          }`;
          this.tags = getMetaTags(content, this.params, { baseUrl });
        }

        if (env.mode === 'development') {
          console.log('[content/view]', {
            data,
            params: this.params,
            tags: this.tags,
          });
        }
        return content;
      })
    );

    // this.data$.subscribe(x => console.log("this.data:", x));
  }
  ngAfterViewInit(): void {
    // todo: use HighlightJS for `<code>..</code>`
  }

  /**
   * display a dialog to the user to install the PWA app
   */
  showInstallDialog(ev: any) {
    this.dialog.open(AppDialogComponent, { data: ev });
  }

  /**
   * display a dialog to the user to grant the permission for push notifications
   */
  showNotificationsDialog() {
    this.dialog.open(NotificationsDialogComponent);
  }
}
