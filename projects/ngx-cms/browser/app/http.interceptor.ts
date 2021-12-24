// todo: move functions (toFormData, queryParams, ...) to the package 'ngx-utils/http'

import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpHandler,
  HttpRequest,
  HttpEvent,
  HttpErrorResponse,
  HttpParams,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import env from '~config/browser/env';

interface Obj {
  [key: string]: any;
}

@Injectable()
/**
 * adjusts the ongoing and the response requests
 * sets the url of the outgoing request to `/api/v1/${url}` and catch errors
 * must be provided before 'UniversalInterceptor' that adds the absolute path to the outgoing request's url
 */
export class ApiInterceptor implements HttpInterceptor {
  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    // todo: only in outgoing requests
    // todo: only API requests (not routerLink)

    let changes = {
      url: req.url.startsWith('/api/v')
        ? req.url
        : `/api/v1${req.url.startsWith('/') ? '' : '/'}${req.url}`,
      // use toFormData in POST requests
      // todo: if(req.context.toFormData)
      // sending data as FormData instead of Object may cause that req.body=undefined
      body:
        req.method.toLowerCase() === 'post' ? toFormData(req.body) : req.body,
      params: queryParams(req.params),
    };

    // todo: if(context.progress) req:{ reportProgress: true, observe: 'events' },
    // use `observe: 'events'` to see all events, including the progress of transfers.
    /*
     next.handle().pipe(map((event: HttpEvent<any>) => {
    if ([ HttpEventType.UploadProgress,HttpEventType.DownloadProgress].include(event.type)) {
          event.type = "progress";
          event.value = Math.round((event.loaded * 100) / event.total);
        }
      }
        */

    let newReq = req.clone(changes);
    // newReq.body.x = 2;

    if (env.mode === 'development') {
      console.log(`[httpService] ${newReq.method} ${req.url} -> ${newReq.url}`);
    }
    return (
      next
        .handle(newReq)
        // catch errors
        .pipe(catchError(errorHandler))
    );
  }
}

export function errorHandler(error: HttpErrorResponse): Observable<never> {
  // if(error.status===0) -> client-side or network error
  // else -> server error

  // Return an observable with error object.
  console.error('[httpService] error:', error);
  return throwError(error);
}

/**
 * use formData when the form contains files (i.e: multipart),
 * otherwise send the data as a json object
 * note that body-parser doesn't handle multipart data which is what FormData is submitted as.
 * instead use: busboy, formidable, multer, ..
 * https://stackoverflow.com/questions/37630419/how-to-handle-formdata-from-express-4/37631882#37631882
 * @method toFormData
 * @param  data
 * @param  singleElements append the element as a single entry i.e: JSON.stringify(el)
 * @return FormData
 */
export function toFormData(data: Obj, singleElements?: string[]): FormData {
  if (data instanceof FormData) {
    return data;
  }

  let formData = new FormData();
  for (let key in data) {
    if (data.hasOwnProperty(key)) {
      let el = data[key];
      if (
        (el instanceof Array || el instanceof FileList) &&
        (!singleElements || !singleElements.includes(key))
      ) {
        // if (!key.endsWith("[]")) key += "[]";
        // FileList.forEach() is not a function
        for (let i = 0; i < el.length; i++) {
          if (el.hasOwnProperty(i)) {
            formData.append(key, el[i]);
          }
        }
      } else {
        if (el === null) {
          // stringify the value to be sent via API
          // formData converts null to "null" , FormData can contain only strings or blobs
          el = '';
        } else if (el instanceof Array) {
          el = JSON.stringify(el);
        }
        formData.append(key, el);
      }
    }
  }

  return formData;
}

export function queryParams(query: Obj = {}): HttpParams {
  let params = new HttpParams();

  for (let key in query) {
    if (query.hasOwnProperty(key)) {
      // HTTPParams is immutable, so queryParams.set() will return a new value
      // and will not update queryParams
      // https://www.tektutorialshub.com/angular/angular-pass-url-parameters-query-strings/
      params = params.set(key, query[key]);
    }
  }
  return params;
}
