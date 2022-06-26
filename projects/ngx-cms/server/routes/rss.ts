import { timer } from '@engineers/javascript/time';
import { resolve } from 'node:path';
import { prod } from '~config/server';
import { getData } from './data';
import Rss from 'rss';
import { query } from '~server/database';
import { parse } from '@engineers/databases/operations';
import {
  html2text,
  length,
  slug,
} from '@engineers/ngx-content-core/pipes-functions';
import cache from '@engineers/nodejs/cache-fs';
import { TEMP } from '.';
import { Request, Response } from 'express';

export default (request: Request, res: Response): void => {
  // todo: cache req.path.xml
  timer(`get ${request.url}`);
  let queryUrl =
    request.params[0] ||
    `/articles/:${prod ? 100 : 10}@status=approved%3Fsort=createdAt:-1`;
  let temporary = `${TEMP}/rss/${queryUrl}.xml`;
  cache(
    temporary,
    () =>
      getData(queryUrl, request.query.refresh ? -1 : 3).then((data) => {
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

        let rss = new Rss({
          // todo: if(@category=*) use category.title
          title: defaultTags.name || 'ngx-cms',
          description: defaultTags.description,
          site_url: baseUrl,
          // or this.route.snapshot.url (toString)
          feed_url: request.path,
          generator: 'ngx-cms platform',
          image_url: `${baseUrl}/assets/site-image/${collection}.webp`,
          language: 'ar,en',
          pubDate: new Date().toUTCString(),
          // cache thi feed for 1d
          ttl: 24 * 60,
          // todo: add categories
          categories: [],
        });

        // get main category to create item slug i.e: collection/category.title/item.id~item.slug
        // todo: save item slug in db when creating or when modifying categories
        return query(`${collection}_categories`).then((categories: any) => {
          // todo: transform(data)
          // - add item.link=categories[0]/slug/..
          data.map((item: any) => {
            let category;
            if (item.categories?.length > 0) {
              category = categories?.payload.find(
                (element: any) => element._id === item.categories[0]
              );
            }
            let itemSlug = `${category ? category.slug : '' || ''}/${slug(
              item.title || '',
              { allowedChars: ':ar' }
            )}`;

            // todo: add more options
            let itemOptions = Object.assign({}, item, {
              guid: item._id,
              // for some reason, rss.item() needs properties to be set explicity
              title: item.title,
              url: `/${collection}/${itemSlug}~${item._id}`,
              description: item.content
                ? length(html2text(item.content, { lineBreak: 'n' }), 500)
                : item.title!,
              date: new Date(
                item.updatedAt || item.createdAt || ''
              ).toUTCString(),
              // todo: get author.name from _id
              author: item.author?.name,
              // todo: add item categories
              categories: [],
              enclosure: {
                url: item.cover
                  ? `/api/v1/image/${collection}-cover-${item._id}/${itemSlug}.webp`
                  : undefined,
              },
              custom_elements: [
                // use description for content summary, and content:encoded for full content
                { 'content:encoded': `<![CDATA[${item.content}]]>` },
              ],
            });

            rss.item(itemOptions);
          });

          return rss.xml({ indent: false });
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
