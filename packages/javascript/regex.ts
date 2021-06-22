/**
 * escape regex string
 * https://github.com/sindresorhus/escape-string-regex
 * @method escape
 * @param  value  [description]
 * @return {string} escaped value
 */
export function escape(value: string): string {
  return value.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&');
}

/**
 * converts string into RegExp
 * @method toRegex
 * @param  value   [description]
 * @return [description]
 */
export function toRegExp(value: string | RegExp): RegExp {
  return typeof value === 'string' ? new RegExp(escape(value)) : value;
}
