export type Pattern = string | RegExp | Array<string | RegExp>;
export type Filter = (value: any) => boolean;

/**
 * escape regex string
 * https://github.com/sindresorhus/escape-string-regexp
 * https://github.com/TypeStrong/ts-loader/issues/653#issuecomment-658129853
 *
 * @function escape
 * @param  value
 * @returns escaped value
 */
export function escape(value: string): string {
  return value.replace(/[$()*+.?[\\\]^{|}]/g, '\\$&');
}

/**
 * converts string into RegExp
 *
 * @function toRegex
 * @param flags
 * @param escapeString
 * @param  value
 * @returns
 */
export function toRegExp(
  // todo: Array<string | RegExp>
  value: Pattern,
  flags?: string,
  escapeString = true
): RegExp {
  let escapedValue: string | RegExp;
  if (typeof value === 'string') {
    escapedValue = escapeString ? escape(value) : value;
  } else if (Array.isArray(value)) {
    escapedValue = value
      .map((element) => {
        if (element instanceof RegExp) {
          // we don't need to escape a RegExp pattern, only escape strings
          return element.source;
        }
        return escapeString ? escape(element) : element;
      })
      .join('|');
  } else if (value instanceof RegExp) {
    escapedValue = value;
  } else {
    throw new TypeError(`value ${value} must be of type Pattern`);
  }
  return typeof escapedValue === 'string'
    ? new RegExp(escapedValue, flags)
    : escapedValue;
}

/**
 * creates a filter function from a pattern
 *
 * @param pattern
 * @param flags
 * @param escapeString
 * @example
 * ['ok1','ok2','other'].filter(filter(/ok/))
 * @returns
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
