import { toRegExp } from './regex';

/**
 * replaces all `replace` parts in a string.
 * String.replace() only replaces the first occurrence
 *
 * @function replaceAll
 * @param  element
 * @param  replace
 * @param  replaceWith will be casted to string
 * @returns the new string, or an array contains the new strings
 * @example replaceAll("abxcdx",'x','y') => "abycdy"
 *
 * todo: replaceAll("abcd",["a","c"],"x") => "xbxd"
 */
export function replaceAll(
  element: string | Array<string>,
  replace: string | RegExp | Array<RegExp>,
  replaceWith: string
): string | Array<any> {
  if (Array.isArray(element)) {
    // el may be a nested array, in this case replaceAll() will return Array<>
    // so element.map() here may return Array<Array> instead of Array<string>
    // so replaceAll() returns Array<any> instead of Array<string>
    return element.map((element_: any) =>
      replaceAll(element_, replace, replaceWith)
    );
  }

  if (Array.isArray(replace)) {
    for (let item of replace) {
      element = replaceAll(element, item, replaceWith);
    }
    return element;
  }

  if (typeof replace === 'string') {
    // replace must be escaped,
    // to prevent replaceAll(value,'.','replaceWith') from replacing everything
    // instead of replacing '.' only
    replace = toRegExp(replace, 'g');
  }

  return element.replace(replace, replaceWith.toString());
  // faster than element.split(replace).join(replaceWith)
  // https://jsperf.com/replace-all-vs-split-join
}

/**
 * asynchronously replace a part of a string
 *
 * @function replaceAsync
 * @param str
 * @param regex
 * @param replacer a function that returns a promise that resoles to `replaceWith`
 * @returns
 *
 * todo: merge replaceAsync() with replaceAll(), where replaceWith: (()=>Promise<string>)
 */
/*
 https://github.com/RSamaium/async-replace
todo:
 - regex = Regex | string
 - replacer: any (string | fn:()=>any | async fn | promise | any other type (cast to string))
   ex: replacer may be a promise or a function that returns a promise
 */
/**
 *
 * @param element
 * @param regex
 * @param replacer
 * @returns
 */
export function replaceAsync(
  element: string,
  regex: RegExp,
  replacer: (...matched: any[]) => Promise<string>
): Promise<string> {
  let matched = element.match(regex);
  if (!matched) {
    return Promise.resolve(element);
  }
  // if regex is global (i.e: /regex/g) we need to recursively apply the replacement
  if (!regex.global) {
    return replacer(...matched).then((newString: any) =>
      element.replace(regex, newString)
    );
  } else {
    let index_ = 0,
      index = 0,
      result: string[] = [],
      // eslint-disable-next-line security-node/non-literal-reg-expr
      copy = new RegExp(regex.source, regex.flags.replace('g', '')),
      callbacks: any = [];

    while (matched.length > 0) {
      // remove the first element and return it
      let substr: string = matched.shift() || '';
      // position of substr after the current index
      let nextIndex = element.indexOf(substr, index);
      result[index_] = element.slice(index, nextIndex);
      index_++;
      let index__ = index_;
      callbacks.push(
        replacer(...(substr.match(copy) || []), nextIndex, element).then(
          (newString: any) => {
            result[index__] = newString;
          }
        )
      );
      index = nextIndex + substr.length;
      index_++;
    }
    result[index_] = element.slice(index);
    return Promise.all(callbacks).then(() => result.join(''));
  }
}

/**
 * perform replace() recursively
 * https://stackoverflow.com/a/14806999/12577650
 *
 * @param value
 * @param pattern
 * @param newValue
 * @example
 * replaceRec('xxx',/x/,'x') -> result: `x`
 * 'xxx'.replace(/x/,'x') -> result: `xx`
 * @returns
 */
export function replaceRec(
  value: string,
  pattern: RegExp,
  newValue: string
): string {
  let newString = value.replace(pattern, newValue);
  return newString === value
    ? newString
    : replaceRec(newString, pattern, newValue);
}

// eslint-disable-next-line no-secrets/no-secrets
/**
 * converts a string to a number if possible
 * useful if the value always been passed as a string,
 * for example when it received from `cli` or asa url parameter
 * https://github.com/substack/minimist/blob/aeb3e27dae0412de5c0494e9563a5f10c82cc7a9/index.js#L240
 *
 * @param value
 * @returns a number if it could e converted, or the original value
 */
export function toNumber(value: string | number): number | string {
  if (typeof value === 'number') {
    return value;
  }
  if (
    // hexadecimal numbers, example: 0xFF
    /^0x[\da-f]+$/i.test(value) ||
    // example: +1.2e-5
    /^[+-]?\d+(?:\.\d*)?(?:e[+-]?\d+)?$/.test(value)
  ) {
    return Number(value);
  }

  return value;
}

/**
 * converts an object-like string into a plain object
 *
 * @param value accepts two formats: `key=value` or `JSON.stringify({...}}`
 * @param pairsDelimiter
 * @param keyValueDelimiter
 * @returns
 */
export function stringToObject(
  value?: string,
  pairsDelimiter = ',',
  keyValueDelimiter = '='
): { [key: string]: any } {
  if (!value) return {};
  value = decodeURIComponent(value);
  let object: { [key: string]: string } = {};

  if (value.startsWith('{') || value.startsWith('[')) {
    // example: '{k1:"v1", k2:"v2"}' or '["value"]'
    object = JSON.parse(value);
  } else if (value.includes(keyValueDelimiter)) {
    // example: 'k1=v1,k2=v2'
    value.split(pairsDelimiter).forEach((element: string) => {
      let [key, value] = element.split(keyValueDelimiter);
      object[key] = value;
    });
  } else {
    throw new Error(`[javascript] stringToObject: invalid value: ${value}`);
  }

  return object;
}

/* todo:
  export interface String {
    replaceAll(
      str: string,
      replace: string | RegExp,
      replaceWith: string
    ): string;
  }
  String.prototype.replaceAll = replaceAll;
  or proto('method')=> string.prototype...
  */
