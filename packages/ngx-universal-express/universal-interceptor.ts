// https://angular.io/guide/universal#using-absolute-urls-for-server-requests
import { Inject, Injectable, Optional } from '@angular/core';
import {
  HttpEvent,
  HttpHandler,
  HttpHeaders,
  HttpInterceptor,
  HttpRequest,
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
    request: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    let serverRequest: HttpRequest<any> = request;
    if (this.request) {
      let newUrl = /^https?:/.test(request.url)
        ? request.url
        : `${this.request.protocol}://${this.request.get('host')}${
            !request.url.startsWith('/') ? '/' : ''
          }${request.url}`;

      // req is immutable, you have to clone it and modify the cloned object
      // use req.clone({url}) -> equivalent to `{...req, url: 'newUrl'}`
      serverRequest = request.clone({ url: newUrl });
    }

    return next.handle(serverRequest);
  }
}
