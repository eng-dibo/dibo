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

export default (req: Request, res: Response): void => {
  // todo: cache req.path.xml
  timer(`get ${req.url}`);
  // todo: queryUrl=[]
  let queryUrl =
    req.params[0] || `/articles/@status=approved%3Fsort=createdAt:-1`;
  let tmp = `${TEMP}/sitemap/${queryUrl}.xml`;
  cache(
    tmp,
    () =>
      getData(queryUrl, req.query.refresh ? -1 : 3).then((data) => {
        if (!(data instanceof Array)) {
          Promise.reject({ error: { message: 'data error' } });
        }

        let nativeRequire = require('@engineers/webpack/native-require');
        let defaultTags = nativeRequire(
          resolve(__dirname, '../config/browser/meta')
        );
        let queryObject = parse(queryUrl);
        let { collection } = queryObject;
        let baseUrl =
          defaultTags.baseUrl || `${req.protocol}://${req.hostname}`;

        let content = `
          <?xml version="1.0" encoding="UTF-8"?>
          <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
          `;

        // todo: see ./rss comments
        return query(`${collection}_categories`).then((categories: any) => {
          data.map((item: any) => {
            let category;
            if (item.categories && item.categories.length > 0 && categories) {
              category = categories.find(
                (el: any) => el._id === item.categories[0]
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
    { age: req.query.refresh ? -1 : 24 * 30 }
  )
    .then((feed) => {
      res.set('Content-Type', 'text/xml');
      res.send(feed);
      if (!prod) {
        console.log(
          `[server/api] getData: +${timer(`get ${req.url}`, true)}sec`
        );
      }
    })
    .catch((error: any) => {
      if (!prod) {
        console.error(
          `[server/api] getData: ${timer('get ' + req.url, true)}`,
          { error }
        );
      } else {
        error.details.uri = '** check logs **';
      }

      res.json({ error });
    });
};
