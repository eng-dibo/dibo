import { timer } from '@engineers/javascript/time';
import { resolve } from 'node:path';
import { prod } from '~config/server';
import { getData } from './data';
import Rss from 'rss';
import { forkJoin, of } from 'rxjs';
import { connect, query } from '~server/database';
import { parse } from '@engineers/databases/operations';
import { slug } from '@engineers/ngx-content-core/pipes-functions';
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

        let queryObject = parse(queryUrl);
        let { collection } = queryObject;
        let baseUrl = `${req.protocol}://${req.hostname}`;
        let nativeRequire = require('@engineers/webpack/native-require');
        let defaultTags = nativeRequire(
          resolve(__dirname, '../../config/browser/meta')
        );

        let rss = new Rss({
          // todo: if(@category=*) use category.title
          title: defaultTags.name || 'ngx-cms',
          description: defaultTags.description,
          site_url: defaultTags.baseUrl || baseUrl,
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
            item.slug = category
              ? category.slug || slug(category.title!)
              : 'general';
            item.slug += '/' + slug(item.title || '');
            item.url = `/${collection}/${item.slug}~${item._id}`;

            // todo: add more options
            let itemOptions = Object.assign({}, item, {
              // for some reason, rss.item() needs properties to be set explicity
              title: item.title,
              description: item.content
                ? // todo: summary(el.content, { lineBreak: '\n', length: 500 })
                  item.content
                : item.title!,
              date: new Date(
                item.updatedAt || item.createdAt || ''
              ).toUTCString(),
              author: item.author?.name,
              // todo: add item categories
              categories: [],
              enclosure: {
                url: item.cover
                  ? `/api/v1/image/${collection}-cover-${item._id}/${item.slug}.webp`
                  : undefined,
              },
            });
            rss.item(itemOptions);
          });
          return rss.xml({ indent: false });
        });
      }),
    { age: req.query.refresh ? -1 : 3 }
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
