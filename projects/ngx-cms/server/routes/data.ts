import { Operation, parse } from '@engineers/databases/operations';
import { timer } from '@engineers/javascript/time';
import { connect, query } from '~server/database';
import cache from '@engineers/nodejs/cache-fs';
import { prod } from '~config/server';
import { supportedCollections } from './supported-collections';

import { TEMP } from '.';
import { Request, Response } from 'express';

/**
 * database operation (using operation syntax @engineers/databases/operations.parse())
 * must be the last route (because it starts with a variable)
 *
 * syntax: operation:db.collection/portions?query
 *
 * examples:
 * - articles -> get all articles
 * - articles/:50 -> get all articles, limit=50
 * - articles/123 -> get article where _id=123
 * - articles/:50@category=1 -> get articles where category=1, limit=50
 * - articles/:50?limit=10 -> query overrides portions
 * - articles/@category=^$slug-name -> get articles from a category by its slug
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
    console.log('[server/routes]', { queryUrl, queryObject });
  }

  if (!supportedCollections.includes(collection)) {
    return Promise.reject({
      error: {
        message: `unknown collection ${collection}, use /api/v1/collections to list the allowed collections`,
      },
    });
  }

  // stringify queryUrl to use it as cache name
  // todo: implement queryObjectToUrl() or stringify()
  if (typeof queryUrl !== 'string') {
    let temporaryQuery = '';
    for (let key in params) {
      temporaryQuery += `${key}=${params[key]}`;
    }
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
      connect().then(async () => {
        // get articles from a category by its slug instead of its _id
        // prefix slug name with '^'
        // example: 'articles/@category=^$slug-name'
        if (params && params.filter && params.filter.includes('category=^')) {
          // todo: return cache('articles_categories.json',..)

          // example: 'status=approved,category=^slug,key=value' => 'slug'
          let slug = params.filter.split('category=^').pop().split(',')[0];

          let category = await query(
            `${collection}_categories/:1~_id@slug=${slug}`
          );
          if (category?.length > 0) {
            params!.filter = params!.filter.replace(
              `category=^${slug}`,
              `categories=${category[0]._id}`
            );
          } else {
            Promise.reject(`[server] category ${slug} not found`);
          }
        }

        return query(queryObject);
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
