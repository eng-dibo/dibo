// todo: convert RSS to sitemap instead of fetching the database and creating links list from scratch

import { timer } from '@engineers/javascript/time';
import { resolve } from 'node:path';
import { prod } from '~config/server';
import { getData } from './data';
import { query } from '~server/database';
import { parse } from '@engineers/databases/operations';
import { slug } from '@engineers/ngx-content-core/pipes-functions';
import cache from '@engineers/nodejs/cache-fs';
import { TEMP } from '.';
import { Request, Response } from 'express';

export default (request: Request, res: Response): void => {
  // todo: cache req.path.xml
  timer(`get ${request.url}`);
  // todo: queryUrl=[]
  let queryUrl =
    request.params[0] || `/articles/@status=approved%3Fsort=createdAt:-1`;
  let temporary = `${TEMP}/sitemap/${queryUrl}.xml`;
  cache(
    temporary,
    () =>
      getData(queryUrl, request.query.refresh ? -1 : 3).then((data) => {
        data = data.payload;
        if (!Array.isArray(data)) {
          Promise.reject({ error: { message: 'data error' } });
        }

        let nativeRequire = require('@engineers/webpack/native-require');
        let defaultTags = nativeRequire(
          resolve(__dirname, '../config/browser/meta')
        );
        let queryObject = parse(queryUrl);
        let { collection } = queryObject;
        let baseUrl =
          defaultTags.baseUrl || `${request.protocol}://${request.hostname}`;

        let content = `
          <?xml version="1.0" encoding="UTF-8"?>
          <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
          `;

        // todo: see ./rss comments
        return query(`${collection}_categories`).then((categories: any) => {
          data.map((item: any) => {
            let category;
            if (item.categories?.length > 0) {
              category = categories?.payload?.find(
                (element: any) => element._id === item.categories[0]
              );
            }
            let itemSlug = `${category ? category.slug : '' || ''}/${slug(
              item.title || '',
              { allowedChars: ':ar' }
            )}`;

            // lastmod format: yyy-mm-dd
            // https://www.sitemaps.org/protocol.html
            let date = new Date(item.updatedAt || item.createdAt || '');

            content += `
              <url>
                <loc>${baseUrl}/${collection}/${itemSlug}~${item._id}</loc>
                <lastmod>${
                  date.getFullYear() +
                  '-' +
                  (date.getMonth() + 1) +
                  '-' +
                  date.getDate()
                }</lastmod>
                <changefreq>monthly</changefreq>
              </url>            
            `;
          });

          content += '</urlset>';

          return content.trim();
        });
      }),
    { age: request.query.refresh ? -1 : 24 * 30 }
  )
    .then((feed) => {
      res.set('Content-Type', 'text/xml');
      res.send(feed);
      if (!prod) {
        console.log(
          `[server/api] getData: +${timer(`get ${request.url}`, true)}sec`
        );
      }
    })
    .catch((error: any) => {
      if (!prod) {
        console.error(
          `[server/api] getData: ${timer('get ' + request.url, true)}`,
          { error }
        );
      } else {
        error.details.uri = '** check logs **';
      }

      res.json({ error });
    });
};
