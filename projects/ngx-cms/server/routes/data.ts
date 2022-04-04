import { parse } from '@engineers/databases/operations';
import { timer } from '@engineers/javascript/time';
import { query } from '~server/database';
import cache from '@engineers/nodejs/cache';
import { prod } from '~config/server';
import { supportedCollections } from './supported-collections';
import { connect } from '~server/database';
import { TEMP } from '.';

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
 */
export function getData(queryUrl: string, age = 24 * 30): Promise<any> {
  let queryObject = parse(decodeURIComponent(queryUrl));
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

  // todo: add querystring to the cache file ex: articles_index?filter={status:approved}
  // todo: cache find* operations only
  let tmp = `${TEMP}/${queryUrl}.json`;

  return cache(
    tmp,
    () =>
      // @ts-ignore: error TS2349: This expression is not callable.
      // Each member of the union type ... has signatures, but none of those signatures are compatible with each other.
      connect().then(() => {
        // get articles from a category by its slug instead of its _id
        // prefix slug name with '^'
        // example: 'articles/@category=^$slug-name'
        if (params.filter && params.filter.includes('category=^')) {
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

    { age }
  );
}

export default (req: any, res: any, next: any) => {
  timer(`get ${req.url}`);

  // todo: ?refresh=AUTH_TOKEN
  getData(req.path, req.query.refresh ? -1 : 3)
    .then((payload: any) => {
      res.json(payload);
      if (!prod) {
        console.log(
          `[server/api] getData: +${timer(`get ${req.url}`, true)}sec`
        );
      }
    })
    .catch((error: any) => {
      if (!prod) {
        console.error(
          `[server/api] getData: +${timer(`get ${req.url}`, true)}sec`,
          { error }
        );
      } else {
        error.details.uri = '** check logs **';
      }

      res.json({ error });
    });
};
