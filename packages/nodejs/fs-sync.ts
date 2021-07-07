/**
 * fs and path helpers
 * todo: use `timer` for long-running functions
 */
import {
  resolve as _resolve,
  normalize,
  join,
  dirname,
  basename,
  extname,
} from 'path';
import { objectType, Obj } from '@engineers/javascript/objects';

import {
  existsSync,
  // same as statSync, but doesn't follow symlinks
  // https://www.brainbell.com/javascript/fs-stats-structure.html
  lstatSync,
  renameSync,
  readdirSync,
  unlinkSync,
  rmdirSync,
  writeFileSync,
  mkdirSync as _mkdirSync,
  MakeDirectoryOptions,
  PathLike,
  WriteFileOptions,
  readFileSync,
} from 'fs';
import stripJsonComments from 'strip-json-comments';

/**
 * resolves path segments into an absolute path
 * @returns the absolute path
 * @example resolve('/a','b/file.js') => 'a/b/file.js'
 */
export function resolve(...paths: PathLike[]): string {
  let stringPaths = paths.map((el) => el.toString());
  // if it null it will be the current working dir (of the working script)
  return _resolve(normalize(join(...stringPaths)));
}

export interface ParsePath {
  type: 'dir' | 'file';
  dir: string;
  file: string;
  extension: string | undefined;
}
/**
 * parses a path to get information about it
 */
export function parsePath(path: PathLike): ParsePath {
  let extension = getExtension(path);
  return {
    type: isDir(path) ? 'dir' : 'file',
    dir: dirname(path.toString()),
    file: basename(path.toString(), `.${extension}`),
    extension,
  };
}

/**
 * get file extension without the leading dot
 * files that starts with a dot, the first dot considered as a part of the file name, not extension
 * @example getExtension('file.js') -> 'js'
 * @example getExtension('.gitignore') -> ''
 */
export function getExtension(file: PathLike): string {
  return extname(file.toString()).toLowerCase().replace(/^\./, '');
}

/**
 * get file size
 */
export function getSize(
  path: PathLike,
  unit: 'b' | 'kb' | 'mb' | 'gb' = 'b'
): number {
  let units = { b: 0, kb: 1, mb: 2, gb: 3 };
  return lstatSync(path).size / 1024 ** units[unit];
}

export function isDir(path: PathLike): boolean {
  return existsSync(path) && lstatSync(path).isDirectory();
}

export function getModifiedTime(file: PathLike): number {
  return lstatSync(file).mtimeMs;
}

/**
 * creates a directory or more if it doesn't exist
 * @param path path of the directory or a paths array of directories to create
 * @param mode
 * @returns
 * todo: return boolean | {[file:string]: boolean}
 * todo:
 *  - support glob or regex
 *    ex: mkdir(/parent/\.*\/dirName/) creates 'dirName' in each parent/*
 *    dirName must be a string, not a RegExp
 */
export function mkdir(
  path: PathLike | PathLike[],
  mode: number | string = 0o777
): void {
  if (path instanceof Array) {
    return path.forEach((p: PathLike) => {
      mkdir(p, mode);
    });
  }

  let options: MakeDirectoryOptions = { mode, recursive: true };

  if (!existsSync(path)) {
    _mkdirSync(path, options);
  }
}

export enum MoveOptionsExisting {
  'replace',
  'rename',
  'skip',
  'stop',
  'throw',
}
export interface MoveOptions {
  // string: rename pattern ex: [filename]([count++]).[ext]
  existing: MoveOptionsExisting | string | ((path: string) => string);
}

/*
todo:
 - move multiple files:
    move([ ...[from,to,options] ], globalOptions)
    move({ from: to, from:[to, options]},globalOptions)
    move([...from],to,options)
    move(/Regex/, newPath,options)
    move(dir, newDir)
    move(path, newDir) -> newPath=newDir+basename(path)
    move(path, ./newPath) -> newPath=resolve(oldPath,newPath)
 - if `renameSync` failed, try copy & unlink
 - options.existing: replace|rename_pattern|skip|(name)=>newName
 */

export function move(
  path: PathLike,
  newPath: PathLike,
  options?: MoveOptions
): void {
  // todo: mkdir(path) then renameSync()
  return renameSync(path, newPath);
}

export interface RemoveOptions {
  // if true, delete the folder content, but not the folder itself, default=false
  keepDir?: boolean;
}

/**
 * delete files or folders recursively
 * https://stackoverflow.com/a/32197381
 *
 * todo:
 * - return boolean | { [path: string]: boolean }
 */

export function remove(
  path: PathLike | PathLike[],
  options: RemoveOptions = {}
): void {
  if (!path) {
    throw new Error('path not provided');
  }
  if (path instanceof Array) {
    // todo: if(options.notExists ==='stop')
    // path.map((p: PathLike) => ({ [p.toString()]: remove(p, options) }));
    return path.forEach((p: PathLike) => remove(p, options));
  }

  path = resolve(path.toString());
  let opts = Object.assign({}, { keepDir: false }, options);

  if (!existsSync(path)) {
    return;
  }

  if (isDir(path)) {
    readdirSync(path).forEach((file: string) => {
      /* let curPath = `${path}/${file}`;
      if (isDir(curPath)) {
        remove(curPath, opts);
      } else {
        unlinkSync(curPath);
      }*/

      remove(`${path}/${file}`, opts);
    });

    if (!opts.keepDir) {
      rmdirSync(path);
    }
  } else {
    unlinkSync(path);
  }
}

// todo: fix Cannot find module '@engineers/javascript/objects' from 'packages/nodejs/fs-sync.ts'
// https://stackoverflow.com/questions/68185573/ts-jest-cannot-resolve-tsconfig-aliases
export function write(
  path: PathLike,
  data: any,
  options?: WriteFileOptions
): void {
  path = resolve(path);
  mkdir(dirname(path));
  let dataString = ['array', 'object'].includes(objectType(data))
    ? JSON.stringify(data)
    : data;
  // todo: if(JSON.stringify error)->throw error

  return writeFileSync(path, dataString, options);
}

export interface ReadOptions {
  mode?: 'json' | 'txt';
  encoding?: BufferEncoding | null;
  flag?:
    | 'a'
    | 'ax'
    | 'a+'
    | 'ax+'
    | 'as'
    | 'as+'
    | 'r'
    | 'r+'
    | 'rs+'
    | 'w'
    | 'wx'
    | 'w+'
    | 'wx+';
}
/**
 * read a file and return its content
 * @param file
 * @param options
 */
export function read(
  path: PathLike,
  options?: ReadOptions | BufferEncoding
): string | Array<any> | Obj {
  if (typeof options === 'string') {
    options = { encoding: options } as ReadOptions;
  }

  let defaultOptions: ReadOptions = {
    mode: 'txt',
    encoding: null,
    flag: 'r',
  };
  let opts: ReadOptions = Object.assign({}, defaultOptions, options);

  let data = readFileSync(path, {
    encoding: opts.encoding,
    flag: opts.flag,
  }).toString();
  return opts.mode === 'json' || path.toString().trim().slice(-5) === '.json'
    ? JSON.parse(stripJsonComments(data))
    : data;
}

/**
 * strip comments from a content
 * it removes:
 *   // this comment
 *   # and this one
 *   /* and multi-line comments *\/
 * @param content
 * @returns the clean content
 */
/*
 todo:
  - this function causes error if the value contains `/*`
    use https://www.npmjs.com/package/strip-json-comments
    ```
    {
      paths:{
        'dir/*': '/path/to/*'
      }
    }
    ```
*/

export function stripComments(content: string): string {
  // '(\/\/|#).*' => removes `// comment` and `# comment`
  // '\/\*(.|\n)*\*\/' => removes `/* multi-line comments */
  // (.|\n)*: matches any character including newline
  return content.replace(/(\/\/|#).*|\/\*(.|\n)*\*\//g, '');
}
