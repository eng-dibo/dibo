/* eslint-disable unicorn/better-regex */
/* eslint-disable sort-keys */
import { queryToObject } from '@engineers/javascript/url';

export interface Operation {
  operation?: string;
  database?: string;
  collection: string;
  portions?: Array<any>;
  params?: { [key: string]: any };
}

/**
 * parse an operation syntax as a string to an object
 * full syntax: operation:db.collection/portion1/portion2?params&x=1
 * only collection is require, other parts are optional
 *
 * @param url the url-like string to be parsed
 * @example
 *   find:users/1 -> find users where id=1 (the default primary key name may be differ between databases drivers)
 *   find:users/1?params -> use params to provide extra options
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
 *   for some operations portions are parsed and added to params,
 *   for example: parse() can get skip, limit, condition for the operation 'find'
 *   if portions are not parsed, it will be included without modifications in portions[]
 * @returns {Operation} {@link Operation}
 */
export function parse(url: string): Operation {
  /*
      pattern:
        (?:\/)?           -> url may start with an optional '/
        (?:([^:\/]+):)?   -> operation, any character sequence except ':' and '/', followed by ':'
        (?:([^\/.]+)\.)?  -> database, any character sequence except '/' and '.' followed by '.'
        ([^\/]+)          -> collection
        \/([^?]+)          -> portions (example: item id), 
                             some operation supports multiple portions (update/selector/data)
                             may contain '/'
        (?:\?(.+)?)?           -> params, the part after '?'

    */
  let pattern =
    // todo: fix this linting
    // eslint-disable-next-line unicorn/better-regex, regexp/no-useless-escape, regexp/no-super-linear-backtracking, regexp/no-useless-non-capturing-group, no-useless-escape
    /^(?:\/)?(?:([^:\/]+):)?(?:([^\/.]+)\.)?([^\/]+)(?:\/([^?]+))?(?:\?(.+)?)?$/;
  let match = url.match(pattern);
  if (match) {
    let [
      fullMatch,
      operation = 'find',
      database,
      collection,
      _portions,
      _parameters,
    ] = match;

    let portions = _portions ? _portions.split('/') : [];
    // convert query to object
    let parameters = queryToObject(_parameters || '');

    // parse portions and add known portions syntax to params
    // find/skip:limit~fields@conditions
    // consumer has to determine when to use something like findOne, findMany, ...
    if (
      ['find', 'delete', 'update', 'replace'].includes(operation) &&
      portions &&
      portions.length > 0
    ) {
      let fieldsMatch = portions[0].match(/~([^:~@]+)/),
        filterMatch = portions[0].match(/@([^:~@]+)/),
        rangeMatch = portions[0].match(/([^:~@]+)?:([^:~@]+)?/);

      if (rangeMatch) {
        if (!parameters.skip && rangeMatch[1]) {
          parameters.skip = +rangeMatch[1];
        }
        if (!parameters.limit && rangeMatch[2]) {
          parameters.limit = +rangeMatch[2];
        }

        portions[0] = portions[0].replace(rangeMatch[0], '');
      }

      if (!parameters.fields && fieldsMatch) {
        parameters.fields = fieldsMatch[1];
        portions[0] = portions[0].replace(fieldsMatch[0], '');
      }

      if (!parameters.filter && filterMatch) {
        parameters.filter = filterMatch[1];
        portions[0] = portions[0].replace(filterMatch[0], '');
      }

      if (!fieldsMatch && !filterMatch && !rangeMatch) {
        parameters.id = portions[0];
        portions.shift();
      }

      if (portions[0] === '') {
        portions.shift();
      }
    }

    // convert to numeric values
    // query.limit may be provided by the user as string
    if (parameters.limit) {
      parameters.limit = +parameters.limit;
    }
    if (parameters.skip) {
      parameters.skip = +parameters.skip;
    }

    return {
      operation,
      database,
      collection,
      portions,
      params: parameters,
    };
  }

  throw new Error(`[operations.parse()] invalid url ${url}`);
}

/**
 * converts queryObject to queryUrl as string
 * use cases:
 *   - send queryUrl as string via APIs
 *   - save cache file name as queryUrl
 *
 * @param queryObject
 * @returns {string} queryUrl
 */
export function toQueryUrl(queryObject: Operation): string {
  // todo: validate queryObject, example queryObject.operation shouldn't contain ':' or '/'
  // todo: add spec
  let url = '';
  if (queryObject.operation) {
    url += `${queryObject.operation}:`;
  }

  if (queryObject.database) {
    url += `${queryObject.database}.`;
  }

  url += `${queryObject.collection}`;

  if (queryObject.portions) {
    url += `/${queryObject.portions.join('/')}`;
  }

  if (queryObject.params) {
    url += `?${JSON.stringify(queryObject.params)}`;
  }

  return url;
}
