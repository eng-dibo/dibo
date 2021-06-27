import { objectType, cleanObject, isIterable, Obj } from './objects';

/**
 * merges or concatenates arrays, strings and objects.
 * @param elements the elements that will be merged
 * @returns the final merged object
 *
 * @example
 *  merge([1,2], [3,4]) => [1,2,3,4]
 *  merge({x:1, y:2}, {y:3, z:4}) => {x:1, y:3, z:4}
 *  merge("x", "y") => "xy"
 *
 * todo: options.deepMerge:boolean
 */
export function merge(...elements: any[]): any {
  // don't use "arguments" in an arrow functions,
  // also don't use 'this' inside a normal function,
  let target = elements.shift(),
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

export interface MergeOptions {
  // deep merging level, 0 = unlimited
  level?: number;
  // whether to merge arrays
  mergeArrays?: boolean;
  strategy?: (el1: any, el2: any, options: MergeOptions) => any;
}

/**
 *  performs a deep merge
 *  this function doesn't mutate the objects
 * @method deepMerge
 * @return the new merged objects
 */
// todo: check: https://lodash.com/docs/4.17.15#merge
// todo: https://stackoverflow.com/questions/27936772/how-to-deep-merge-instead-of-shallow-merge/34749873
// https://stackoverflow.com/questions/44402096/in-typescript-define-a-type-for-an-array-where-the-first-element-is-more-specif
// todo: overload export function deepMerge(...elements:Obj[]):Obj => ([elements],{})
export function deepMerge(
  elements: Array<Obj>,
  options: MergeOptions = {}
): any {
  let defaultOptions = {
    level: 0,
    mergeArrays: false,
    // strategy: (el1:any, el2:any, options) => {},
  };
  // make 'options' immutable
  let opts = Object.assign({}, defaultOptions, options),
    result: Obj = {};

  elements.forEach((el) => {
    el = cleanObject(el);
    // todo: result=strategy(result,el,options)
    // or result[k]=strategy(result[k],el[k],options)
    // or result=strategy(result,el,k,options)
    for (let k in el) {
      if (k in result && objectType(el[k]) === 'object') {
        // ex: deepMerge({a: {x:1}}, {a: {y:2}}) -> {a: {x:1,y:2}}
        result[k] = deepMerge([result[k], el[k]]);
      } else {
        result[k] = el[k];
      }
    }
  });

  return result;
}
