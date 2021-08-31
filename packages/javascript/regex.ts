export type Pattern = string | RegExp | Array<string>;
export type Filter = (value: any) => boolean;

/**
 * escape regex string
 * https://github.com/sindresorhus/escape-string-regexp
 * https://github.com/TypeStrong/ts-loader/issues/653#issuecomment-658129853
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
  // todo: Array<string | RegExp>
  value: Pattern,
  flags?: string,
  escapeString = true
): RegExp {
  if (typeof value === 'string') {
    value = escapeString ? escape(value) : value;
  } else if (value instanceof Array) {
    value = value.map((el) => (escapeString ? escape(el) : el)).join('|');
  }
  return typeof value === 'string' ? new RegExp(value, flags) : value;
}

/**
 * creates a filter function from a pattern
 * @param pattern
 * @param flags
 * @example
 * ['ok1','ok2','other'].filter(filter(/ok/))
 */
export function toFilter(
  pattern?: Filter | Pattern,
  flags?: string,
  escapeString?: boolean
): Filter {
  if (!pattern) {
    // always include the value
    return () => true;
  } else if (typeof pattern !== 'function') {
    return (value: any) => toRegExp(pattern, flags, escapeString).test(value);
  }
  return pattern;
}
