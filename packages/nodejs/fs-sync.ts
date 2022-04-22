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
} from 'node:path';
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
  copyFileSync,
} from 'node:fs';

// strip-json-comments v4.0.0 supports esm only
// to use it in a commonjs project use version < 4.0.0
// or use https://www.npmjs.com/package/jsonminify
// https://github.com/sindresorhus/strip-json-comments/issues/53#issuecomment-1024804079
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

/**
 * delete files or folders recursively
 * https://stackoverflow.com/a/32197381
 *
 * todo:
 * - return boolean | { [path: string]: boolean }
 */

export function remove(
  path: PathLike | PathLike[],
  // if true, delete the folder content, but not the folder itself, default=false
  keepDir = false
): void {
  return recursive(path, (file, type) =>
    type === 'file' ? unlinkSync(file) : !keepDir ? rmdirSync(file) : undefined
  );
}

export function copy(
  path: PathLike,
  destination: string,
  filter: (file: string) => boolean = () => true
) {
  return recursive(path, (file, type) => {
    if (type === 'file' && filter(file)) {
      mkdir(destination);
      copyFileSync(file, file.replace(path.toString(), destination));
    }
  });
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
  // file age in milliseconds
  age?: number;
}
/**
 * read a file and return its content
 * @param file
 * @param options
 */
export function read(
  path: PathLike,
  options?: ReadOptions | BufferEncoding
): Buffer | string | Array<any> | Obj {
  let defaultOptions: ReadOptions = {
    encoding: null,
    flag: 'r',
    age: 0,
  };
  let opts: ReadOptions = Object.assign(
    defaultOptions,
    typeof options === 'string' ? { encoding: options } : options || {}
  );

  // todo: test
  if (
    opts.age &&
    opts.age > 0 &&
    getModifiedTime(path) + opts.age < Date.now()
  ) {
    throw new Error(`[fs-sync] expired file ${path}`);
  }

  let data = readFileSync(path, {
    encoding: opts.encoding,
    flag: opts.flag,
  });

  if (opts.encoding === undefined) {
    return data;
  }
  data = data.toString();
  return path.toString().trim().slice(-5) === '.json'
    ? JSON.parse(stripJsonComments(data as string))
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

/**
 * get entries (files and directories) recursively.
 * @param dir the root path to start search from.
 * @param filter filters the entries by a function or regex pattern
 * or entry type (file or directory)
 * @param depth if provided, the search will stop at the specified depth
 * @returns promise that resolves to the filtered entries.
 */

export function getEntries(
  dir = '.',
  filter?: ((entry: string) => boolean) | RegExp | 'files' | 'dirs' | '*',
  depth?: number
): Array<string> {
  let _filter: ((entry: string) => boolean) | undefined;

  if (filter === 'files') {
    _filter = (entry: string) => lstatSync(entry).isFile();
  } else if (filter === 'dirs') {
    _filter = (entry: string) => lstatSync(entry).isDirectory();
  } else if (filter === '*') {
    _filter = undefined;
  } else if (filter instanceof RegExp) {
    _filter = (entry: string) => (filter as RegExp).test(entry);
  } else if (typeof filter === 'function') {
    _filter = filter;
  }
  // todo: else if(typeof entry === 'string'){/* glob pattern */}

  let entries = readdirSync(dir);
  let result: Array<string> = [];

  entries.forEach((entry) => {
    let fullPath = join(dir, entry);
    if (!_filter || (_filter as (entry: string) => boolean)(fullPath)) {
      result.push(fullPath);
    }

    // also add entries of subdirectories
    if (
      (depth === undefined || depth > 0) &&
      lstatSync(fullPath).isDirectory()
    ) {
      let subEntries = getEntries(
        fullPath,
        filter,
        depth !== undefined ? depth - 1 : undefined
      );
      result = result.concat(subEntries);
    }
  });

  return result;
}

/**
 * recursively apply a function to a directory and all subdirectories
 */
export function recursive(
  path: PathLike | PathLike[],
  apply: (path: string, type: 'dir' | 'file') => void,
  filter: (path: string, type: 'dir' | 'file') => boolean = () => true
): void {
  if (!path) {
    throw new Error('path not provided');
  }
  if (path instanceof Array) {
    return path.forEach((p: PathLike) => recursive(p, apply));
  }

  path = resolve(path.toString());

  if (!existsSync(path)) {
    return;
  }

  if (isDir(path) && filter(path, 'dir')) {
    readdirSync(path).forEach((file: string) => {
      recursive(`${path}/${file}`, apply);
    });

    apply(path, 'dir');
  } else if (filter(path, 'file')) {
    apply(path, 'file');
  }
}
