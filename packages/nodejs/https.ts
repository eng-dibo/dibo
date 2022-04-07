import https, { RequestOptions } from 'https';
import { URL } from 'url';
import { parse } from 'content-type';
import { objectType } from '@engineers/javascript/objects';

/**
 * make https requests and returns a promise
 * @param url
 * @param options
 * @param data
 * @returns
 */
export default function request(
  url: string | URL,
  data?: any,
  options?: RequestOptions
): Promise<any> {
  return new Promise((resolve, reject) => {
    let isObject = ['array', 'object'].includes(objectType(data));
    let requestOptions: RequestOptions = Object.assign(
      { method: data ? 'POST' : 'GET' },
      options || {}
    );

    if (isObject) {
      requestOptions.headers = requestOptions.headers || {};
      requestOptions.headers['content-type'] =
        requestOptions.headers['content-type'] || 'application/json';
    }

    let responseChunks: any[] = [];

    let req = https.request(url, requestOptions, (res) => {
      res.setEncoding('utf8');

      res.on('data', function (chunk) {
        // chunk is string or buffer (if encoding not set)
        responseChunks.push(chunk.toString());
      });

      res.on('end', () => {
        try {
          let response = responseChunks.join('');
          //adjust response based on response type from headers
          // todo: all content types
          let type = parse(res).type;
          if (type === 'application/json') {
            response = JSON.parse(response);
          }

          if (
            res.statusCode &&
            (res.statusCode < 200 || res.statusCode >= 300)
          ) {
            reject(
              ['array', 'object'].includes(objectType(response))
                ? { code: res.statusCode, ...(response as any) }
                : { code: res.statusCode, message: response }
            );
          } else {
            // todo: {...req,body:response}
            resolve(response);
          }
        } catch (err) {
          reject(err);
        }
      });
    });

    req.on('error', (error) => reject(error));

    if (requestOptions.method!.toUpperCase() === 'POST') {
      let dataString = isObject ? JSON.stringify(data) : data;
      req.write(dataString);
    }
    req.end();
  });
}
