import { queryToObject } from '@engineers/javascript/url';

export interface Operation {
  operation: string;
  database: string;
  collection: string;
  item?: string;
  portions: Array<string>;
  query: { [key: string]: any };
}

/**
 * parse an operation syntax as a string to an object
 * full syntax: operation:db.collection/portion1/portion2?query&x=1
 * only collection is require, other parts are optional
 *
 * @param url
 * @examples
 *   find:users/1 -> find users where id=1 (the default primary key name may be differ between databases drivers)
 *   find:users/1?query -> use query to provide extra options
 *   users/5:2  -> find 2 users after the first 5
 *   users/~email,mobile -> get email,mobile fields from users
 *   users/5:~email@id>3,age>20 -> get users where id>3 and age>20, skip the first 5
 *   delete:users/1 -> delete from users where id=1
 *   delete:users/5:2
 *   delete:users/@id>3
 *   deleteOne:users/@id>3
 *   index:users/field1,field2:indexName;field3 -> create indexes
 *   index:users -> get all indexes
 *   dropIndex:users/index1,index2
 *   drop:users
 *   insert:users/{x:1,y:2} -> or http.post('/insert:users', {x:1,y:2})
 *   update:users/selector/data
 *   users/~^_ -> get fields that starts with "_" from users (regex)
 *
 *   for some operations portions are parsed and added to query,
 *   for example: parse() can get skip, limit, condition for the operation 'find'
 *   if portions are not parsed, it will be included without modifications in portions[]
 */
export function parse(url: string): Operation {
  /*
      pattern:
        (?:([^:\/]+):)?   -> operation, any character sequence except ':' and '/', followed by ':'
        (?:([^\/.]+)\.)?  -> database, any character sequence except '/' and '.' followed by '.'
        ([^\/]+)          -> collection
        \/([^?]+)          -> portions (example: item id), 
                             some operation supports multiple portions (update/selector/data)
                             may contain '/'
        (?:\?(.+)?)?           -> query, the part after '?'

    */
  let pattern =
    /^(?:([^:\/]+):)?(?:([^\/.]+)\.)?([^\/]+)(?:\/([^?]+))?(?:\?(.+)?)?$/;
  let match = url.match(pattern);
  if (match) {
    let [fullMatch, operation, database, collection, portions, query] = match;
    // todo: parse portions
    // todo: add portions to query

    return {
      operation: operation || 'find',
      database,
      collection,
      portions: portions ? portions.split('/') : [],
      // convert query to object
      query: queryToObject(query || ''),
    };
  }

  throw new Error(`[operations.parse()] invalid url ${url}`);
}
