// https://angular.io/guide/universal#using-absolute-urls-for-server-requests
import { Injectable, Inject, Optional } from '@angular/core';
import {
  HttpInterceptor,
  HttpHandler,
  HttpRequest,
  HttpHeaders,
  HttpEvent,
} from '@angular/common/http';
import { Request } from 'express';
import { REQUEST } from '@nguniversal/express-engine/tokens';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'any' })
export class UniversalInterceptor implements HttpInterceptor {
  // the REQUEST token is available in the server only (not in the browser)
  // so we make it @Optional(), and it may be undefined
  constructor(@Optional() @Inject(REQUEST) protected request: Request) {}

  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    let serverReq: HttpRequest<any> = req;
    if (this.request) {
      let newUrl = /^(?:https?:)/.test(req.url)
        ? req.url
        : `${this.request.protocol}://${this.request.get('host')}${
            !req.url.startsWith('/') ? '/' : ''
          }${req.url}`;

      // req is immutable, you have to clone it and modify the cloned object
      // use req.clone({url}) -> equivalent to `{...req, url: 'newUrl'}`
      serverReq = req.clone({ url: newUrl });
    }

    return next.handle(serverReq);
  }
}
