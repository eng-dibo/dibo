import { Operation, parse } from '@engineers/databases/operations';
import { timer } from '@engineers/javascript/time';
import { connect, query } from '~~projects/ngx-cms/server/database';
import cache from '@engineers/nodejs/cache-fs';
import { prod } from '~config/server';
import { supportedCollections } from './supported-collections';

import { TEMP } from '.';
import { Request, Response } from 'express';

/**
 *
 * @param queryUrl
 * @param age
 */
export function getData(
  queryUrl: string | Operation,
  age = 24 * 30
): Promise<any> {
  let queryObject =
    typeof queryUrl === 'string'
      ? parse(decodeURIComponent(queryUrl))
      : queryUrl;

  let { operation, database, collection, portions, params } = queryObject;

  if (!prod) {
    console.log('[server/routes]', { queryObject });
  }

  if (!supportedCollections.includes(collection)) {
    return Promise.reject({
      error: {
        message: `unknown collection ${collection}, use /api/v1/collections to list the allowed collections`,
      },
    });
  }

  // stringify queryUrl to use it as cache name
  if (typeof queryUrl !== 'string') {
    let temporaryQuery = '';
    for (let key in params) {
      temporaryQuery += `${key}=${params[key]}`;
    }
    queryObject = queryUrl;
    queryUrl = `${operation}:${database ? database + '.' : ''}${collection}/${(
      portions || []
    ).join('/')}${params ? '?' + temporaryQuery : ''}`;
  }

  let temporary = `${TEMP}/${queryUrl.replace(/^\/?find.*:/, '')}.json`;

  return cache(
    temporary,
    () =>
      // @ts-ignore: error TS2349: This expression is not callable.
      // Each member of the union type ... has signatures, but none of those signatures are compatible with each other.
      connect().then(() => {
        // get articles from a category by its slug instead of its _id
        // prefix slug name with '^'
        // example: 'articles/@category=^$slug-name'
        if (params && params.filter && params.filter.includes('category=^')) {
          // todo: return cache('articles_categories.json',..)

          // example: 'status=approved,category=^slug,key=value' => 'slug'
          let slug = params.filter.split('category=^').pop().split(',')[0];

          return query(`${collection}_categories/:1~_id@slug=${slug}`).then(
            (category: any) =>
              category.length > 0
                ? query(`${collection}/@categories=${category[0]._id}`)
                : Promise.reject(`[server] category ${slug} not found`)
          );
        } else {
          return query(queryObject);
        }

        /*
          // todo:
          if(collection.indexOf('_categories)){
             content = getCategories(collection).then((categories: any) => {
              let ctg = new Categories(categories);

              let category = categories.categories.find(
                (el: any) => el.slug === item
              );

              let branches = [category, ...ctg.getBranches(category)];
              let items = new Set();

              categories = categories.categories
                .find((el: any) => branches.includes(el))
                .forEach((el: any) => {
                  if (el.items instanceof Array) {
                    el.items.forEach((_item: any) => items.add(_item));
                  }
                });

              findOptions.filter._id = { $in: items };
              return query(
                'find',
                collection,
                findOptions.filter,
                findOptions.docs,
                findOptions.options
              );
            });
          }
        */
      }),
    //  cache find* operations only
    { age, refreshCache: operation.startsWith('find') }
  );
}

export default (request: Request, res: Response): void => {
  timer(`get ${request.url}`);

  // todo: ?refresh=AUTH_TOKEN
  getData(request.path, request.query.refresh ? -1 : 3)
    .then((payload: any) => {
      res.json(payload);
      if (!prod) {
        console.log(
          `[server/api] getData: +${timer(`get ${request.url}`, true)}sec`
        );
      }
    })
    .catch((error: any) => {
      if (!prod) {
        console.error(
          `[server/api] getData: +${timer(`get ${request.url}`, true)}sec`,
          { error }
        );
      } else {
        error.details.uri = '** check logs **';
      }

      res.json({ error });
    });
};
