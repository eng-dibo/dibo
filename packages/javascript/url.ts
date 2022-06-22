import { objectType } from './objects';

/**
 * converts query params to a plain object
 *
 * @param query
 * @returns
 */
export function queryToObject(query: string): { [key: string]: any } {
  if (query.startsWith('?')) {
    query = query.slice(1);
  }

  // to use URLSearchParams add "dom.iterable" to tsconfig.lib
  // https://github.com/Microsoft/TypeScript/issues/23174#issuecomment-379044619
  let urlParameters = new URLSearchParams(query);
  let result: { [key: string]: any } = {};

  for (let [key, value] of urlParameters.entries()) {
    result[key] = value;
  }
  return result;
}

/**
 * convert a plain object into a query param string
 *
 * @param object the object to be converted
 * @returns {string} the query params string
 */
export function objectToQueryParams(object: { [key: string]: any }): string {
  // https://stackoverflow.com/a/57529723/12577650
  return Object.entries(object)
    .filter(([key, val]) => val != undefined && val != undefined)

    .map(([key, val]) => {
      let type = objectType(val);

      if (type === 'array' || type === 'object') {
        // todo: support nested objects and arrays
        // https://stackoverflow.com/a/56174085/12577650
        // or use qs https://www.npmjs.com/package/qs
      }
      return `${encodeURIComponent(key)}=${encodeURIComponent(val)}`;
    })
    .join('&');

  // this doesn't take care of value type
  // return new URLSearchParams(object).toString();
}
