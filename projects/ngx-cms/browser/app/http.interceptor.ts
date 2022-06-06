// todo: move functions (toFormData, queryParams, ...) to the package 'ngx-utils/http'

import { Injectable } from '@angular/core';
import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpParams,
  HttpRequest,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import environment from '../env';

interface Object_ {
  [key: string]: any;
}

@Injectable({ providedIn: 'any' })
/**
 * adjusts the ongoing and the response requests
 * sets the url of the outgoing request to `/api/v1/${url}` and catch errors
 * must be provided before 'UniversalInterceptor' that adds the absolute path to the outgoing request's url
 */
export class ApiInterceptor implements HttpInterceptor {
  intercept(
    request: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    // todo: only in outgoing requests
    // todo: only API requests (not routerLink)
    let changes = {
      // if it doesn't start with /api/v1/ or https:
      url: /^(?:https?:|\/?api\/v1\/)/.test(request.url)
        ? request.url
        : `/api/v1${request.url.startsWith('/') ? '' : '/'}${request.url}`,
      // use toFormData in POST requests
      // todo: if(req.context.toFormData)
      // sending data as FormData instead of Object may cause that req.body=undefined

      body:
        request.method.toLowerCase() === 'post' &&
        request.headers.get('toFormData') === 'true'
          ? toFormData(request.body)
          : request.body,
      params: queryParams(request.params),
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

    let newRequest = request.clone(changes);
    if (environment.mode === 'development') {
      console.log(
        `[http interceptor] ${newRequest.method} ${request.url} -> ${newRequest.url}`
      );
    }
    return (
      next
        .handle(newRequest)
        // catch errors
        .pipe(catchError(errorHandler))
    );
  }
}

/**
 *
 * @param error
 */
export function errorHandler(error: HttpErrorResponse): Observable<never> {
  // if(error.status===0) -> client-side or network error
  // else -> server error

  // Return an observable with error object.
  console.error('[http interceptor] error:', error);
  return throwError(error);
}

/**
 * use formData when the form contains files (i.e: multipart),
 * otherwise send the data as a json object
 * note that body-parser doesn't handle multipart data which is what FormData is submitted as.
 * instead use: busboy, formidable, multer, ..
 * https://stackoverflow.com/questions/37630419/how-to-handle-formdata-from-express-4/37631882#37631882
 *
 * @function toFormData
 * @param  data
 * @param  singleElements append the element as a single entry i.e: JSON.stringify(el)
 * @returns FormData
 */
export function toFormData(data: Object_, singleElements?: string[]): FormData {
  if (data instanceof FormData) {
    return data;
  }

  let formData = new FormData();
  for (let key in data) {
    if (data.hasOwnProperty(key)) {
      let element = data[key];
      if (
        // causes error with `multer uploader`
        // todo: test with multiple fileList
        (Array.isArray(element) || element instanceof FileList) &&
        (!singleElements || !singleElements.includes(key))
      ) {
        // or !/\[.*\]/.test(key)
        if (!key.endsWith('[]')) key += '[]';
        // FileList.forEach() is not a function
        for (let index = 0; index < element.length; index++) {
          if (element.hasOwnProperty(index)) {
            formData.append(key, element[index]);
          }
        }
      } else {
        if (element === null) {
          // stringify the value to be sent via API
          // formData converts null to "null" , FormData can contain only strings or blobs
          element = '';
        } else if (Array.isArray(element)) {
          element = JSON.stringify(element);
        }
        formData.append(key, element);
      }
    }
  }

  return formData;
}

/**
 *
 * @param query
 */
export function queryParams(query: Object_ = {}): HttpParams {
  let parameters = new HttpParams();

  for (let key in query) {
    if (query.hasOwnProperty(key)) {
      // HTTPParams is immutable, so queryParams.set() will return a new value
      // and will not update queryParams
      // https://www.tektutorialshub.com/angular/angular-pass-url-parameters-query-strings/
      parameters = parameters.set(key, query[key]);
    }
  }
  return parameters;
}
