/**
 * javascript objects
 */

export interface Obj {
  [key: string]: any;
}

/**
 * returns the object type. i.e: string, array, number, ...
 * @examples
 *  {} => object
 *  [] => array
 *  null => null
 *  function(){} => function
 *  1 => number
 *  "x", 'x', `x` => string
 * @method objectType
 * @param  obj        [description]
 * @return [description]
 */

export function objectType(object: any): string {
  return Object.prototype.toString
    .call(object)
    .replace('[object ', '')
    .replace(']', '')
    .toLowerCase();
}

/**
 * merges or concatenates arrays, strings and objects.
 * @param elements the elements that will be merged
 * @returns the final merged object
 *
 * @example
 *  merge([1,2], [3,4]) => [1,2,3,4]
 *  merge({x:1, y:2}, {y:3, z:4}) => {x:1, y:3, z:4}
 *  merge("x", "y") => "xy"
 */
export function merge(...elements: any[]): any {
  // don't use "arguments" in an arrow functions,
  // also don't use 'this' inside a normal function,
  let _arg = arguments,
    target = elements.shift(),
    targetType = objectType(target);

  elements.forEach((el) => {
    let elementType = objectType(el),
      error = `cannot merge ${targetType} with ${elementType}`;
    if (targetType === 'array') {
      // if any element is not an array, it will be added to the target element
      // ex: merge([1,2], [3,4], 5) => [1,2,3,4,5]
      target = target.concat(el);
    } else if (targetType === 'object') {
      if (elementType === 'string') {
        // ex: merge({x:1}, "y") => {x:1, y:undefined}
        target[el] = undefined;
      } else if (elementType === 'object') {
        // ex: merge({x:1, y:2}, {y:3, z:4}) => {x:1, y:3, z:4}
        target = Object.assign(target, el);
      } else {
        throw new Error(error);
      }
    } else if (targetType === 'string') {
      if (['string', 'number'].includes(elementType)) {
        // ex: merge("x","y") => "xy"
        target += el;
      } else if (elementType === 'array') {
        // ex: merge("x", ["y","z"]) => "xyz"
        el.forEach((item: any) => {
          target = merge(target, item);
        });
      } else {
        throw new Error(error);
      }
    } else if (targetType === 'class') {
      // todo: add or override target's methods & properties
    } else if (isIterable(target)) {
      // todo: merge elements to the iterable target
    } else {
      throw new Error(error);
    }
  });

  return target;
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
 * @method includes
 * @param  element the element that you want to search for
 * @param  container
 * @param  options
 * @return boolean
 *
 * todo: add more container types (class,. ...)
 * todo: support RegExp in array containers, ex: includes('x', [/x/])
 * todo: return {matched:true, value: matchedValue};
 *       this helps inspecting the matched regexp;
 *       don't return the value, because it may be === fale
 * todo: for object containers: options.find='key' | 'value'
 */
export function includes(
  element: any,
  container: Array<any> | object | string,
  options?: IncludesOptions
): boolean {
  let defaultOptions = {
    caseSensitive: false,
    find: 'key',
    elementAsItem: true,
  };
  options = merge(defaultOptions, options || {});

  // if element is Array, check if the container includes any of element[] items
  // todo: options.all=true, to check if the container includes *all* of them
  if (element instanceof Array && options?.elementAsItem === false) {
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
    } else if (container instanceof Array) {
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
    return container.indexOf(element) > -1;
  } else if (container instanceof Array) {
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
 * @param object
 * @returns
 */
export function isPromise(object: any): boolean {
  return !!(
    object instanceof Promise ||
    (object && typeof object.then === 'function')
  );
}

export function isEmpty(object: any): boolean {
  // note that in js: `[]!=[]` and `{}!={}` because every one is a new instance.
  // so, ['', 0, null, [], {}].includes([]) returns false
  return (
    ['', 0, false, null, undefined, [], {}].includes(object) ||
    (object instanceof Array && object.length === 0) ||
    (objectType(object) === 'object' && Object.keys(object).length === 0)
  );
}

/**
 * divide Array into chunks
 * @method chunk
 * @param  array
 * @param  chunkSize number of elements of each chunk
 * @return an array of chunks
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
  for (let i = 0; i < array.length; i += chunkSize) {
    result.push(array.slice(i, i + chunkSize));
  }
  return result;
}

/**
 * remove circular references from the object
 * @param object
 * @return the clean object after removing the circular references
 */
export function cleanObject(object: Obj): Obj {
  if (objectType(object) !== 'object') {
    throw new Error('the element is not an object');
  }
  // todo: https://stackoverflow.com/questions/7582001/is-there-a-way-to-test-circular-reference-in-javascript/7583161#7583161

  return object;
}
