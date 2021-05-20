import { compile, render } from 'ejs';

export interface Config {
  // array of glob paths, default: [*/**/*.(tmpl.*|*.tmpl)]
  // todo: {input: output}, ex: {'*.tmpl.md': '[fileName].md'}
  files?: Array<string>;
  // array of objects or paths to files that returns objects
  // ex: [{key: 'value'}, './package.json']
  values: Array<string | { [key: string]: any }>;
  // output dir, '.tmpl' will be removed from file name
  // default: same source's dir.
  output?: string;
  // ejs options
  options?: any;
}

/**
 * generate files from templates, using ejs engine.
 */
export default function (config: string | Config = './tmpl.config.js'): void {
  if (typeof config === 'string') {
    config = require(config);
  }
}
