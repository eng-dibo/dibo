import { timer } from '@engineers/javascript/time';
import { resolve } from 'node:path';
import { prod } from '~config/server';
import { getData } from './data';
import Rss from 'rss';
import { forkJoin, of } from 'rxjs';
import { connect, query } from '~server/database';
import { parse } from '@engineers/databases/operations';
import {
  slug,
  html2text,
  length,
} from '@engineers/ngx-content-core/pipes-functions';
import cache from '@engineers/nodejs/cache';
import { TEMP } from '.';

export default (req: any, res: any, next: any) => {
  // todo: cache req.path.xml
  timer(`get ${req.url}`);
  let queryUrl =
    req.params[0] || `/articles/:${prod ? 100 : 10}@status=approved`;
  let tmp = `${TEMP}/${queryUrl}.xml`;
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

        let rss = new Rss({
          // todo: if(@category=*) use category.title
          title: defaultTags.name || 'ngx-cms',
          description: defaultTags.description,
          site_url: baseUrl,
          // or this.route.snapshot.url (toString)
          feed_url: req.path,
          generator: 'ngx-cms platform',
          image_url: `${baseUrl}/assets/site-image/${collection}.webp`,
          language: 'ar,en',
          pubDate: new Date().toUTCString(),
          // cache thi feed for 1d
          ttl: 24 * 60,
          // todo: add categories
          categories: [],
        });

        return query(`${collection}_categories`).then((categories) => {
          // todo: transform(data)
          // - add item.link=categories[0]/slug/..
          data.forEach((item: any) => {
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
