/**
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
