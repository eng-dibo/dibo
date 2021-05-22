import { compile, render } from 'ejs';

export interface Config {
  // base dir, default: '.'
  base?: string;
  // array of paths, default: [*/**/*.(tmpl.*|*.tmpl)]
  // todo: {input: output}, ex: {'*.tmpl.md': '[fileName].md'}
  files?: Array<string | RegExp> | ((path: string) => boolean);
  // array of objects or paths to files that returns objects
  // ex: [{key: 'value'}, './package.json']
  values: Array<string | { [key: string]: any }>;
  // string: output dir, replaces base dir, and the latest '.tmpl' will be removed from file name
  // default: same template path.
  // or function that takes the template path and returns the full file path
  // or an object {base, path}, the file path will be concatenated with the output base dir.
  output?:
    | string
    | ((path: string) => string)
    | { base: string; path: (path: string) => string };
  // ejs options
  options?: any;
}

/**
 * generate files from templates, using ejs engine.
 */
export default function (config: string | Config = './tmpl.config.js'): void {
  if (typeof config === 'string') {
    config = require(config) as Config;
  }
  config.base = config.base || '.';
  config.files = config.files || ['*/**/*.(tmpl.*|*.tmpl)'];
  // todo: let files = nodejs.getFilesSync(config.base, config.files).foreach(...);
  // nodejs.getFilesSync(dir='.', filter=Array<string|Regex> | (path)=>bool):filePath[]
}
