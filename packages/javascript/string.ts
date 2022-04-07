import { timer } from './time';

const dev = process.env.NODE_ENV === 'development',
  logger = console;
// todo: allow the consumer to change `logger`, ex: logger= Winston

/**
 * replaces all `replace` parts in a string.
 * String.replace() only replaces the first occurrence
 * @method replaceAll
 * @param  element
 * @param  replace
 * @param  replaceWith will be casted to string
 * @return the new string, or an array contains the new strings
 * @example replaceAll("abxcdx",'x','y') => "abycdy"
 *
 * todo: replaceAll("abcd",["a","c"],"x") => "xbxd"
 */
export function replaceAll(
  element: string | Array<string>,
  replace: string | RegExp | Array<string | RegExp>,
  replaceWith: any
): string | Array<any> {
  if (element instanceof Array) {
    // el may be a nested array, in this case replaceAll() will return Array<>
    // so element.map() here may return Array<Array> instead of Array<string>
    // so replaceAll() returns Array<any> instead of Array<string>
    return element.map((el: any) => replaceAll(el, replace, replaceWith));
  }

  if (replace instanceof Array) {
    replace.forEach((el) => {
      element = replaceAll(element, el, replaceWith);
    });
    return element;
  }
  replace = new RegExp(replace, 'g');
  return element.replace(replace as RegExp, replaceWith.toString());
  // faster than element.split(replace).join(replaceWith)
  // https://jsperf.com/replace-all-vs-split-join
}

/**
 * asynchronously replace a part of a string
 * @method replaceAsync
 * @param str
 * @param regex
 * @param replacer a function that returns a promise that resoles to `replaceWith`
 * @return
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
export function replaceAsync(
  element: string,
  regex: RegExp,
  replacer: (...matched: any[]) => Promise<string>
): Promise<string> {
  timer('replaceAsync');
  let matched = element.match(regex);
  if (!matched) {
    return Promise.resolve(element);
  }
  // if regex is global (i.e: /regex/g) we need to recursively apply the replacement
  if (!regex.global) {
    return replacer(...matched).then((newStr: any) =>
      element.replace(regex, newStr)
    );
  } else {
    let i = 0,
      index = 0,
      result: string[] = [],
      copy = new RegExp(regex.source, regex.flags.replace('g', '')),
      callbacks: any = [];

    while (matched.length > 0) {
      // remove the first element and return it
      let substr: string = matched.shift() || '';
      // position of substr after the current index
      let nextIndex = element.indexOf(substr, index);
      result[i] = element.slice(index, nextIndex);
      i++;
      let j = i;
      callbacks.push(
        replacer(...(substr.match(copy) || []), nextIndex, element).then(
          (newStr: any) => {
            result[j] = newStr;
          }
        )
      );
      index = nextIndex + substr.length;
      i++;
    }
    result[i] = element.slice(index);
    return Promise.all(callbacks).then(() => {
      if (dev) {
        logger.debug(`[replaceAsync()] +${timer('replaceAsync')}s`, {
          element,
          regex,
        });
      }
      return result.join('');
    });
  }
}

/**
 * perform replace() recursively
 * https://stackoverflow.com/a/14806999/12577650
 *
 * @example
 * replaceRec('xxx',/x/,'x') -> result: `x`
 * 'xxx'.replace(/x/,'x') -> result: `xx`
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

/**
 * converts a string to a number if possible
 * useful if the value always been passed as a string,
 * for example when it received from `cli` or asa url parameter
 * https://github.com/substack/minimist/blob/aeb3e27dae0412de5c0494e9563a5f10c82cc7a9/index.js#L240
 * @param value
 * @returns a number if it could e converted, or the original value
 */
export function toNumber(value: string | number): number | string {
  if (typeof value === 'number') {
    return value;
  }
  if (
    // hexadecimal numbers, example: 0xFF
    /^0x[0-9a-f]+$/i.test(value) ||
    // example: +1.2e-5
    /^[-+]?(?:\d+(?:\.\d*)??)(?:e[-+]?\d+)??$/.test(value)
  ) {
    return Number(value);
  }

  return value;
}

/**
 * converts an object-like string into a plain object
 * @param value accepts two formats: `key=value` or `JSON.stringify({...}}`
 * @returns
 */
export function stringToObject(
  value?: string,
  pairsDelimiter = ',',
  keyValueDelimiter = '='
): { [key: string]: any } {
  if (!value) return {};
  let obj: { [key: string]: string } = {};

  if (value.startsWith('%7B') || value.startsWith('%5B')) {
    // example: '{k1:"v1", k2:"v2"}' or '["value"]'
    obj = JSON.parse(decodeURIComponent(value));
  } else if (value.includes(keyValueDelimiter)) {
    // example: 'k1=v1,k2=v2'
    value.split(pairsDelimiter).forEach((el: string) => {
      let [key, value] = el.split(keyValueDelimiter);
      obj[decodeURIComponent(key)] = decodeURIComponent(value);
    });
  } else {
    throw new Error('[javascript] stringToObject: invalid value');
  }

  return obj;
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
