import { toRegExp } from '@engineers/javascript/regex';
import { includes, Obj } from '@engineers/javascript/objects';
import { resolve } from 'path';

export interface ExternalsParams {
  // the absolute 'request' path
  path: string;
  // the requested path
  request: any;
  // The directory of the file which contains the import statement
  context: any;
  // todo: (...)=>void
  callback: any;
  contextInfo: any;
  getResolve: any;
}

/**
 * function arguments of config.externals[function(...args){}]
 * @method params
 * @param  args   [description]
 * @return [description]
 */
// todo: function params(args: IArguments):ExternalsParams{}
export function params(
  args: any[], // IArguments |
  options: Obj = {}
): ExternalsParams {
  let externalsParams: ExternalsParams = {
    path: '',
    request: '',
    context: '',
    callback: (error?: any, result?: any) => {},
    contextInfo: undefined,
    getResolve: undefined,
  };

  if (args[0].context) {
    // webpack 5
    externalsParams.context = args[0].context;
    externalsParams.request = args[0].request;
    externalsParams.contextInfo = args[0].contextInfo;
    externalsParams.getResolve = args[0].getResolve;
    externalsParams.callback = args[1];
  } else {
    // webpack 4
    externalsParams.context = args[0];
    externalsParams.request = args[1];
    externalsParams.callback = args[2];
  }

  if (externalsParams.request.startsWith('.')) {
    externalsParams.path = resolve(
      externalsParams.context,
      externalsParams.request
    );
  } else {
    externalsParams.path = externalsParams.request;
  }

  return externalsParams;
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
  RegExp | string | ((externalsParams: ExternalsParams) => boolean)
>;

export type ExternalsTransform =
  | string
  // todo: (externalsParams,match)
  | ((externalsParams: ExternalsParams) => string);

export type Report = 'whitelisted' | { matched: any; transform: string };

/**
 * add list of items to webpack's externals
 * @method externals
 * @param list
 * @param transform  a function or string to transform the request; default is `commonjs [request]`
 * @param whitelist an array of paths (strings or regex) to be excluded from adding to externals even if matched
 * @return [description]
 *
 * @example
 * config.externals[function(){ externals(["path",/pathRegex/], arguments) }]
 *
 */
export default function externals(
  list: ExternalsList,
  transform?: ExternalsTransform,
  whitelist?: ExternalsList
): (...args: any[]) => Report {
  return (...args: any[]) => {
    // prevent options from mutation

    // reports every item whether it whitelisted or matched
    // matched: the matched pattern
    // transformed: the transformed value
    let report: Report = 'whitelisted';

    // the callback result
    // null or error -> callback(error)
    // string | [string] | object -> callback(null,transform)
    let action: string | undefined;

    let externalsParams = params(args);
    let { path, request, callback } = externalsParams;

    for (let item of list) {
      // todo: item = 'pattern' | {pattern, ...options}
      // ex: {'^config/(.*).ts', value: 'commonjs [request]/[$1]'}

      let itemMatched: boolean,
        whitelisted = false;

      if (typeof item === 'function') {
        itemMatched = item(externalsParams) === true;
      } else {
        let pattern = toRegExp(item);
        itemMatched = pattern.test(pattern.global ? path : request);
      }

      if (itemMatched) {
        // if any of whitelist[] matched 'request', just return

        if (whitelist) {
          for (let whitelistItem of whitelist) {
            if (typeof whitelistItem === 'function') {
              if (whitelistItem(externalsParams)) {
                whitelisted = true;
                break;
              }
            } else {
              let pattern = toRegExp(whitelistItem);
              if (pattern.test(pattern.global ? path : request)) {
                whitelisted = true;
                break;
              }
            }
          }
        }
        if (!whitelisted) {
          if (transform && typeof transform === 'function') {
            transform = transform(externalsParams);
          }

          transform = (transform || `commonjs2 ${path}`).trim();
          if (transform.length > 0 && transform.indexOf(' ') === -1) {
            //  transform is module type, example: `commonjs2`
            transform = `${transform} ${path}`;
          }

          // support template variable, ex: 'commonjs {{request}}'
          // todo: support multiple groups: ex: "commonjs {{var1}} - {{var2}}"
          transform = transform.replace(
            /\{{(.*)}}/g,
            (...matched: any[]): string => {
              // todo: expose more variables (ex: matches[])
              // todo: support obj.* syntax ex: "commonjs ${var.property}"
              // todo: support js ex: "commonjs ${var.replace('x','y')}"
              // @ts-ignore
              return externalsParams[matched[1]];
            }
          );

          report = {
            matched: item,
            transform,
          };

          action = transform;
          break;
        }
      }
    }

    action ? callback(null, action) : callback();
    // todo: use webpack logger
    // console.log({ report });
    return report;
  };
}

/**
 * add imported package (i.e: doesn't start with ".") to webpack's externals list.
 * exclude node_modules from bundling, use require(package) instead.
 * this function must be added to the *end* of externals[] list,
 * to avoid overriding any user-defined externals() function.
 * @method node
 */
export function node(
  transform?: ExternalsTransform,
  whitelist?: ExternalsList
): (...args: any[]) => Report {
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
    /^(?!\.|\/|\\|.+?:).*/,

    // a path to a `node_modules` dir
    /^.*?\/node_modules\//g,
  ];
  return externals(list, transform, whitelist);
}

// todo: move to pkg/nodejs
// todo: use in node().list[parseNodePackageName]
// https://github.com/npm/validate-npm-package-name
export function validatePackageName(name: string): boolean {
  name = name.trim();
  // length>0
  // [a-z\-.]
  // don't start with ._
  // don't contain ~)('!*

  return true;
}