/**
 * escape regex string
 * https://github.com/sindresorhus/escape-string-regex
 * @method escape
 * @param  value
 * @return escaped value
 */
export function escape(value: string): string {
  return value.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&');
}

/**
 * converts string into RegExp
 * @method toRegex
 * @param  value
 * @return
 */
export function toRegExp(
  value: string | RegExp,
  flags?: string,
  escapeString = true
): RegExp {
  return typeof value === 'string'
    ? new RegExp(escapeString ? escape(value) : value, flags)
    : value;
}
