import { Obj as Object_, cleanObject, isIterable, objectType } from './objects';

/**
 * merges or concatenates arrays, strings and objects.
 *
 * @param elements the elements that will be merged
 * @returns the final merged object
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

  for (let element of elements) {
    let elementType = objectType(element),
      error = `cannot merge ${targetType} with ${elementType}`;
    switch (targetType) {
      case 'array': {
        // if any element is not an array, it will be added to the target element
        // ex: merge([1,2], [3,4], 5) => [1,2,3,4,5]
        target = target.concat(element);

        break;
      }
      case 'object': {
        if (elementType === 'string') {
          // ex: merge({x:1}, "y") => {x:1, y:undefined}
          target[element] = undefined;
        } else if (elementType === 'object') {
          // ex: merge({x:1, y:2}, {y:3, z:4}) => {x:1, y:3, z:4}
          target = Object.assign(target, element);
        } else {
          throw new Error(error);
        }

        break;
      }
      case 'string': {
        if (['string', 'number'].includes(elementType)) {
          // ex: merge("x","y") => "xy"
          target += element;
        } else if (elementType === 'array') {
          // ex: merge("x", ["y","z"]) => "xyz"
          element.forEach((item: any) => {
            target = merge(target, item);
          });
        } else {
          throw new Error(error);
        }

        break;
      }
      case 'class': {
        // todo: add or override target's methods & properties

        break;
      }
      default:
        if (isIterable(target)) {
          // todo: merge elements to the iterable target
        } else {
          throw new Error(error);
        }
    }
  }

  return target;
}

export interface MergeOptions {
  // deep merging level, 0 = unlimited
  level?: number;
  // whether to merge arrays
  mergeArrays?: boolean;
  strategy?: (element1: any, element2: any, options: MergeOptions) => any;
}

/**
 *  performs a deep merge
 *  this function doesn't mutate the objects
 *
 * @param elements
 * @param options
 * @function deepMerge
 * @returns the new merged objects
 */
// todo: check: https://lodash.com/docs/4.17.15#merge
// todo: https://stackoverflow.com/questions/27936772/how-to-deep-merge-instead-of-shallow-merge/34749873
// https://stackoverflow.com/questions/44402096/in-typescript-define-a-type-for-an-array-where-the-first-element-is-more-specif
// todo: overload export function deepMerge(...elements:Obj[]):Obj => ([elements],{})
export function deepMerge(
  elements: Array<Object_>,
  options: MergeOptions = {}
): any {
  let defaultOptions = {
    level: 0,
    mergeArrays: false,
    // strategy: (el1:any, el2:any, options) => {},
  };
  // make 'options' immutable
  let options_ = Object.assign({}, defaultOptions, options),
    result: Object_ = {};

  for (let element of elements) {
    element = cleanObject(element);
    // todo: result=strategy(result,el,options)
    // or result[k]=strategy(result[k],el[k],options)
    // or result=strategy(result,el,k,options)
    for (let k in element) {
      if (k in result && objectType(element[k]) === 'object') {
        // ex: deepMerge({a: {x:1}}, {a: {y:2}}) -> {a: {x:1,y:2}}
        result[k] = deepMerge([result[k], element[k]]);
      } else {
        result[k] = element[k];
      }
    }
  }

  return result;
}
