/**
 * format objects dor console methods.
 * import from './console'
 */

import { inspect, InspectOptions } from 'util';
import { objectType } from './objects';

export let formatOptions: InspectOptions = {
  maxArrayLength: null,
  depth: null,
  colors: true,
  breakLength: 100,
  // compact: false,
};
/**
 * format and flatten objects before logging it in the console,
 * instead of just showing [Object]
 * @param type lo type, ex: log | warn | info,...
 * @param elements
 */
export function format(...elements: any[]): any[] {
  // to override options, export a class
  // export class /*extends console*/{ log(){} }

  return elements.map((el) => inspect(el, formatOptions));
}

function apply(
  methods: string[],
  cb: (type: string, args: any[]) => any[]
): void {
  methods.forEach((type: string) => {
    let method = console[type as keyof typeof console];
    console[type as keyof typeof console] = (...args: any[]): void => {
      method.apply(console, cb(type, args));
    };
  });
}

apply(
  ['error', 'warn', 'log', 'info', 'debug', 'dir', 'trace'],
  (type, elements) => {
    return format(...elements);
  }
);

apply(['assert', 'debug'], (type, args) => {
  // only format elements for this signature: assert(false,obj,...)
  // not assert(false,strings)

  if (type === 'assert') {
    // if the first arg (i.e condition) is false, no need to format the elements,
    // because console.assert will not print any output
    if (args.shift()) {
      return args;
    }
  }

  return objectType(args[0]) === 'object' ? format(...args) : args;
});
