/**
 * javascript objects
 */

export interface Obj {
  [key: string]: any;
}

/**
 * returns the object type. i.e: string, array, number, ...
 *
 * @example
 *  {} => object
 *  [] => array
 *  null => null
 *  function(){} => function
 *  1 => number
 *  "x", 'x', `x` => string
 * @function objectType
 * @param  obj        [description]
 * @returns [description]
 */

/**
 *
 * @param object
 * @returns
 */
export function objectType(object: any): string {
  return Object.prototype.toString
    .call(object)
    .replace('[object ', '')
    .replace(']', '')
    .toLowerCase();
}
export interface IncludesOptions {
  // for string elements, default: false
  caseSensitive?: boolean;
  // for object containers, default: key
  find?: 'key' | 'value';
  // determine whether to treat array elements as a single item, or iterate over them
  elementAsItem?: boolean;
}

/**
 * check if the container includes the element
 *
 * @function includes
 * @param  element the element that you want to search for
 * @param  container
 * @param  options
 * @returns boolean
 *
 * todo: add more container types (class,. ...)
 * todo: support RegExp in array containers, ex: includes('x', [/x/])
 * todo: return {matched:true, value: matchedValue};
 *       this helps inspecting the matched regexp;
 *       don't return the value, because it may be === false
 * todo: for object containers: options.find='key' | 'value'
 */
export function includes(
  element: any,
  container: Array<any> | object | string,
  options?: IncludesOptions
): boolean {
  let defaultOptions = {
    caseSensitive: false,
    elementAsItem: true,
    find: 'key',
  };
  options = Object.assign(defaultOptions, options || {});

  // if element is Array, check if the container includes any of element[] items
  // todo: options.all=true, to check if the container includes *all* of them
  if (Array.isArray(element) && options?.elementAsItem === false) {
    for (let item of element) {
      if (includes(item, container, options)) {
        return true;
      }
    }
    return false;
  }

  if (element instanceof RegExp) {
    if (typeof container === 'string') {
      // ex: includes(/x/, 'xyz')
      return element.test(container);
    } else if (Array.isArray(container)) {
      // ex: includes(/x/, ['x','y','z'])
      for (let item of container) {
        if (includes(element, item)) {
          return true;
        }
      }
      return false;
    } else if (objectType(container) === 'object') {
      // ex: includes(/x/, {x:1})
      return includes(element, Object.keys(container));
    }
  } else if (objectType(element) === 'object') {
    // ex: includes({x:1}, ['x'])
    return includes(Object.keys(element), container);
  }

  if (!options?.caseSensitive && typeof element === 'string') {
    element = element.toLowerCase();
  }
  if (typeof container === 'string') {
    // ex: includes('x', 'xyz')
    return container.includes(element);
  } else if (Array.isArray(container)) {
    // ex: includes('x', ['x','y','z'])
    return container.includes(element);
  } else if (objectType(container) === 'object') {
    // ex: includes('x', {x:1})
    return element in container;
  } else if (isIterable(container)) {
    // todo: other iterable types
  }

  // todo: throw exception if the container is not iterable
  return false;
}

/**
 * check if the element is iterable, but not a string.
 *
 * @param object
 * @returns boolean
 */
export function isIterable(object: any): boolean {
  // in case of 'null', it returns null, so we need to cast it into boolean
  // using `!!`

  return !!(
    ['array', 'object'].includes(objectType(object)) ||
    (object &&
      typeof object[Symbol.iterator] === 'function' &&
      typeof object !== 'string')
  );
}

/**
 * check if the object a promise or a promise-like, i.e has `.then()`
 *
 * @param object
 * @returns
 */
export function isPromise(object: any): boolean {
  return !!(
    object instanceof Promise ||
    (object && typeof object.then === 'function')
  );
}

/**
 *
 * @param object
 * @returns
 */
export function isEmpty(object: any): boolean {
  // note that in js: `[]!=[]` and `{}!={}` because every one is a new instance.
  // so, ['', 0, null, [], {}].includes([]) returns false
  return (
    ['', 0, false, null, undefined, [], {}].includes(object) ||
    (Array.isArray(object) && object.length === 0) ||
    (objectType(object) === 'object' && Object.keys(object).length === 0)
  );
}

/**
 * divide Array into chunks
 *
 * @function chunk
 * @param  array
 * @param  chunkSize number of elements of each chunk
 * @returns an array of chunks
 * @example chunk([1,2,3,4], 2) => [ [1,2], [3,4]]
 */
export function chunk(
  array: Array<any>,
  chunkSize?: number
): Array<Array<any>> {
  if (chunkSize === undefined) {
    chunkSize = array.length;
  }

  if (chunkSize < 1) {
    throw new Error('chunkSize must be > 0');
  }

  let result = [];
  for (let index = 0; index < array.length; index += chunkSize) {
    result.push(array.slice(index, index + chunkSize));
  }
  return result;
}

/**
 * remove circular references from the object
 *
 * @param object
 * @returns the clean object after removing the circular references
 */
export function cleanObject(object: Obj): Obj {
  if (objectType(object) !== 'object') {
    throw new Error('the element is not an object');
  }
  // todo: https://stackoverflow.com/questions/7582001/is-there-a-way-to-test-circular-reference-in-javascript/7583161#7583161

  return object;
}

/**
 * filter objects by keys
 *
 * @example
 *   object = {a:1, b:2, c:3, d: 4}
 *   keys = ['a', 'b']
 *   filterObjectByKeys(object, keys) -> {a:1, b:2}
 * @param object
 * @param keys
 * @returns
 */
export function filterObjectByKeys(object: Obj, keys: Array<string>): Obj {
  // https://stackoverflow.com/a/47443227/12577650
  return Object.fromEntries(keys.map((key) => [key, object[key]]));

  // or: https://stackoverflow.com/a/54976713/12577650
  // return Object.assign({}, ...keys.map((key) => ({ [key]: keys[key] })));
}

/**
 * converts string with dot notation into an object key
 *
 * @param keys
 * @param value
 * @example 'a.b.c' -> {a: {b:{ c: value}}}
 * @returns
 */
export function stringToObject(keys: string | Array<string>, value?: any): Obj {
  let object: Obj = {};
  if (typeof keys === 'string') {
    keys = keys.split('.');
  }

  let temporary = object;

  for (let index = 0; index < keys.length - 1; index++) {
    let key: string = keys[index];

    if (!(key in temporary)) {
      temporary[key] = {};
    }

    temporary = temporary[key];
  }

  // last element
  let _key = keys[keys.length - 1];
  temporary[_key] = value;

  return object;
}

/**
 * flatten the nested objects into the top-level as a dot-notation string
 * use case: sending the object to a plain-text environment such as cli or as a url parameter.
 * https://stackoverflow.com/a/69246829/12577650
 *
 * @param value
 * @param delimiter
 * @example {a:{b:1, {x:{y:2}}}} -> {a.b:1, a.x.y:2 }
 * @returns
 */
export function flatten(value: Obj, delimiter = '.'): Obj {
  /**
   *
   * @param object
   * @param parent
   * @returns
   */
  function walk(object: Obj, parent = ''): Obj {
    parent = parent.trim();
    let result: Obj = {};
    for (let [key, value_] of Object.entries(object)) {
      let prefix = parent !== '' ? `${parent}${delimiter}${key}` : key;

      if (objectType(value_) === 'object') {
        let flattened = walk(value_, prefix);
        // todo: remove keys from flattened
        Object.assign(result, flattened);
      } else {
        result[prefix] = value_;
      }
    }
    return result;
  }

  return walk(value);
}
