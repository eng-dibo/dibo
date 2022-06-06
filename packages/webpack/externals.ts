// todo: move to externalsPlugin, to avoid wrapping it inside a function and passing 'arguments' param

import { toRegExp } from '@engineers/javascript/regex';
import { Obj, includes } from '@engineers/javascript/objects';
import { resolve } from 'node:path';

export interface ExternalsParameters {
  // the absolute 'request' path
  path: string;
  // the requested path
  request: string;
  // The directory of the file which contains the import statement
  context: any;
  // todo: (...)=>void
  callback: any;
  contextInfo: any;
  getResolve: any;
}

/**
 * function arguments of config.externals[function(...args){}]
 *
 * @function params
 * @param arguments_
 * @param options
 * @param  args   [description]
 * @returns [description]
 */
// todo: function params(args: IArguments):ExternalsParams{}
export function params(
  arguments_: any[], // IArguments |
  options: Obj = {}
): ExternalsParameters {
  let externalsParameters: ExternalsParameters = {
    path: '',
    request: '',
    context: '',
    callback: (error?: any, result?: any) => {},
    contextInfo: undefined,
    getResolve: undefined,
  };

  if (arguments_[0].context) {
    // webpack 5
    externalsParameters.context = arguments_[0].context;
    externalsParameters.request = arguments_[0].request;
    externalsParameters.contextInfo = arguments_[0].contextInfo;
    externalsParameters.getResolve = arguments_[0].getResolve;
    externalsParameters.callback = arguments_[1];
  } else {
    // webpack 4
    externalsParameters.context = arguments_[0];
    externalsParameters.request = arguments_[1];
    externalsParameters.callback = arguments_[2];
  }

  externalsParameters.path = externalsParameters.request.startsWith('.')
    ? resolve(externalsParameters.context, externalsParameters.request)
    : externalsParameters.request;

  return externalsParameters;
}

// if an ExternalsList[] item is a function and it's value is true,
// then this item is whitelisted
// note: to whitelist paths that doesn't include a module: ^((?!moduleName).)+$

/**
 * type ExternalsListItem: a list of patterns to be added to webpack.externals or whitelist
 *  - RegExp: if global it matches against full `path`,
 *    otherwise it matches against `request`
 * - string: always matches against `path`
 *  - function: return true to include the requested item
 */
export type ExternalsList = Array<
  RegExp | string | ((externalsParameters: ExternalsParameters) => boolean)
>;

export type ExternalsTransform =
  | string
  // todo: (externalsParams,match)
  | ((externalsParameters: ExternalsParameters) => string);

export type Report =
  | {
      status: 'whitelisted' | 'transformed';
      matched: any;
      transform?: string;
      arguments?: any;
    }
  | undefined;

/**
 * add list of items to webpack's externals
 * if any item of this list matched the request and didn't match the whitelist transform it
 * you need to wrap externals() inside a function and pass it's arguments to it as the first param
 * so it executed every time with new arguments, i.e: evaluate a new transform value
 *
 * @function externals
 * @param args
 * @param arguments_
 * @param list
 * @param transform  a function or string to transform the request; default is `commonjs {{request}}`
 * @param whitelist an array of paths (strings or regex) to be excluded from adding to externals even if matched
 * @returns
 * @example
 * config.externals[ function(){externals(arguments,["path",/pathRegex/])} ]
 */
export default function externals(
  arguments_: any,
  list: ExternalsList,
  transform?: ExternalsTransform,
  whitelist?: ExternalsList
): Report {
  // prevent options from mutation

  // reports every item whether it whitelisted or matched
  // matched: the matched pattern
  // transformed: the transformed value
  let report: Report;

  // the callback result
  // null or error -> callback(error)
  // string | [string] | object -> callback(null,transform)
  let action: string | undefined;

  let externalsParameters = params(arguments_);
  let { path, request, callback } = externalsParameters;

  for (let item of list) {
    // todo: item = 'pattern' | {pattern, ...options}
    // ex: {'^config/(.*).ts', value: 'commonjs [request]/[$1]'}

    let itemMatched: boolean | RegExpMatchArray | null,
      whitelisted = false;

    if (typeof item === 'function') {
      itemMatched = item(externalsParameters);
    } else {
      let pattern = toRegExp(item);
      // itemMatched = pattern.test(pattern.global ? path : request);
      itemMatched = (pattern.global ? path : request).match(pattern);
    }

    if (itemMatched) {
      // if any of whitelist[] matched 'request', just return

      if (whitelist) {
        for (let whitelistItem of whitelist) {
          if (typeof whitelistItem === 'function') {
            if (whitelistItem(externalsParameters)) {
              whitelisted = true;
              report = {
                status: 'whitelisted',
                matched: whitelistItem,
                arguments: externalsParameters,
              };
              break;
            }
          } else {
            let pattern = toRegExp(whitelistItem);
            if (pattern.test(pattern.global ? path : request)) {
              whitelisted = true;
              report = {
                status: 'whitelisted',
                matched: whitelistItem,
                arguments: externalsParameters,
              };
              break;
            }
          }
        }
      }
      if (!whitelisted) {
        if (transform && typeof transform === 'function') {
          transform = transform(externalsParameters);
        }

        transform = ((transform as string) || `commonjs2 ${path}`).trim();
        if (transform.length > 0 && !transform.includes(' ')) {
          //  transform is module type, example: `commonjs2`
          transform = `${transform} ${path}`;
        }

        // support template variable, ex: 'commonjs {{request}}'
        // only works if item is RegExp or string or a function that returns a Regexp or String
        // i.e doesn't work if item is a function that returns boolean
        // todo: support multiple groups: ex: "commonjs {{var1}} - {{var2}}"
        if (Array.isArray(itemMatched)) {
          transform = transform.replace(
            /{{(.*?)}}/g,
            (...matched: any[]): string => {
              // todo: expose more variables (ex: matches[])
              // todo: support obj.* syntax ex: "commonjs ${var.property}"
              // todo: support js ex: "commonjs ${var.replace('x','y')}"
              let matchedValue = matched[1];
              if (matchedValue.startsWith('$')) {
                return itemMatched![
                  matchedValue.slice(1) as keyof typeof itemMatched
                ];
              }
              // @ts-ignore
              return externalsParameters[matchedValue];
            }
          );
        }

        report = {
          status: 'transformed',
          matched: item,
          transform,
          arguments: externalsParameters,
        };

        action = transform;
        break;
      }
    }
  }

  action ? callback(null, action) : callback();
  // todo: use webpack logger
  return report;
}

/**
 * add imported package (i.e: doesn't start with ".") to webpack's externals list.
 * exclude node_modules from bundling, use require(package) instead.
 * this function must be added to the *end* of externals[] list,
 * to avoid overriding any user-defined externals() function.
 *
 * @param transform
 * @param whitelist
 * @function node
 */
export function node(
  transform?: ExternalsTransform,
  whitelist?: ExternalsList
): (...arguments_: any[]) => Report {
  let list = [
    /*
    match request that doesn't start with ".", ex: ".." and "./"
    but not an absolute path (ex: D:/path in windows or /path in linux)
    todo: use parseNodePackageName() regex
   pattern:
    ^ starts with
    (?!..)  negative lookahead
    . | \/ | \\ | .+?:  doesn't start with any of these characters (.+?: matches D:/)
    */

    // non-global pattern to apply the check on 'request' only instead of 'path',
    // as 'path' is an absolute path, and never starts with '.'
    /^(?![./\\]|.+?:).*/,

    // a path to a `node_modules` dir
    /^.*?\/node_modules\//g,
  ];
  return function (...args) {
    return externals(args, list, transform, whitelist);
  };
}
