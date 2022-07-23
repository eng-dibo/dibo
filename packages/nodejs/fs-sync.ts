/**
 * fs and path helpers
 * todo: use `timer` for long-running functions
 */
import {
  resolve as _resolve,
  basename,
  dirname,
  extname,
  join,
  normalize,
} from 'node:path';
import { Obj, objectType } from '@engineers/javascript/objects';

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
 *
 * @param {...any} paths
 * @returns the absolute path
 * @example resolve('/a','b/file.js') => 'a/b/file.js'
 */
export function resolve(...paths: PathLike[]): string {
  let stringPaths = paths.map((element) => element.toString());
  // if it null it will be the current working dir (of the working script)
  return _resolve(normalize(join(...stringPaths)));
}

export interface ParsePath {
  type: 'dir' | 'file';
  dir: string;
  name: string;
  extension: string | undefined;
}
/**
 * parses a path to get information about it
 *
 * @param path
 */
export function parsePath(path: PathLike): ParsePath {
  path = path.toString();
  let extension = getExtension(path);
  return {
    type: isDir(path) ? 'dir' : 'file',
    // path of the containing dir
    dir: dirname(path),
    // basename (file or folder name) without extension
    name: basename(path, `.${extension}`),
    extension,
  };
}

/**
 * get file extension without the leading dot
 * files that starts with a dot, the first dot considered as a part of the file name, not extension
 *
 * @param file
 * @example getExtension('file.js') -> 'js'
 * @example getExtension('.gitignore') -> ''
 */
export function getExtension(file: PathLike): string {
  return extname(file.toString()).toLowerCase().replace(/^\./, '');
}

/**
 * get file(s) or directories total size
 *
 * @param path
 * @param unit
 * @param filter
 */
export function getSize(
  path: PathLike | PathLike[],
  unit: 'b' | 'kb' | 'mb' | 'gb' = 'b',
  filter?: Filter
): number {
  let units = { b: 0, kb: 1, mb: 2, gb: 3 };
  let sizes = recursive(
    path,
    (_path, type) =>
      type === 'file' ? lstatSync(_path).size / 1024 ** units[unit] : undefined,
    filter
  );

  let sum = (sizes: any) => {
    let total = 0;
    for (let size of sizes) {
      total += Array.isArray(size) ? sum(size) : size;
    }
    return total;
  };
  return Array.isArray(sizes) ? sum(sizes) : sizes;
}

/**
 *
 * @param path
 */
export function isDir(path: PathLike): boolean {
  path = resolve(path);
  return existsSync(path) && lstatSync(path).isDirectory();
}

/**
 *
 * @param file
 * @param path
 */
export function getModifiedTime(path: PathLike): number {
  return lstatSync(resolve(path)).mtimeMs;
}

/**
 * creates a directory or more if it doesn't exist
 *
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
  if (Array.isArray(path)) {
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

/**
 *
 * @param path
 * @param newPath
 * @param options
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

/**
 *
 * @param path
 * @param filter
 * @param keepDir
 */
export function remove(
  path: PathLike | PathLike[],
  filter?: Filter,
  // if true, delete the folder content, but not the folder itself, default=false
  keepDir = false
): void {
  return recursive(
    path,
    (file, type) =>
      type === 'file'
        ? unlinkSync(file)
        : !keepDir
        ? rmdirSync(file)
        : undefined,
    filter
  );
}

/**
 *
 * @param source
 * @param destination
 * @param filter
 */
export function copy(
  source: PathLike,
  destination: string,
  filter: Filter = () => true
) {
  source = resolve(source);
  destination = resolve(destination);
  return recursive(source, (path, type) => {
    if (type === 'file' && filter(path)) {
      let destination_ = path.replace(source.toString(), destination);
      mkdir(dirname(destination_));
      copyFileSync(path, destination_);
    }
  });
}

// todo: fix Cannot find module '@engineers/javascript/objects' from 'packages/nodejs/fs-sync.ts'
// https://stackoverflow.com/questions/68185573/ts-jest-cannot-resolve-tsconfig-aliases
/**
 *
 * @param path
 * @param data
 * @param options
 */
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
 *
 * @param file
 * @param path
 * @param options
 */
export function read(
  path: PathLike,
  options?: ReadOptions | BufferEncoding
): Buffer | string | Array<any> | Obj {
  path = resolve(path);

  let defaultOptions: ReadOptions = {
    encoding: null,
    flag: 'r',
    age: 0,
  };
  let options_: ReadOptions = Object.assign(
    defaultOptions,
    typeof options === 'string' ? { encoding: options } : options || {}
  );

  if (
    options_.age &&
    options_.age > 0 &&
    getModifiedTime(path) + options_.age < Date.now()
  ) {
    throw new Error(`[fs-sync] expired file ${path}`);
  }

  let data = readFileSync(path, {
    encoding: options_.encoding,
    flag: options_.flag,
  });

  if (options_.encoding === undefined) {
    return data;
  }
  data = data.toString();
  return path.toString().trim().slice(-5) === '.json'
    ? JSON.parse(stripJsonComments(data))
    : data;
}

/**
 * strip comments from a content
 * it removes:
 *   // this comment
 *   # and this one
 *   /* and multi-line comments *\/
 *
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

/**
 *
 * @param content
 */
export function stripComments(content: string): string {
  // '(\/\/|#).*' => removes `// comment` and `# comment`
  // '\/\*(.|\n)*\*\/' => removes `/* multi-line comments */
  // (.|\n)*: matches any character including newline
  return content.replace(/(\/\/|#).*|\/\*(.|\n)*\*\//g, '');
}

/**
 * get entries (files and directories) recursively.
 *
 * @param dir the root path to start search from.
 * @param filter filters the entries by a function or regex pattern
 * or entry type (file or directory)
 * @param depth if provided, the search will stop at the specified depth
 * @returns promise that resolves to the filtered entries.
 */

/**
 *
 * @param dir
 * @param filter
 * @param depth
 */
export function getEntries(
  dir = '.',
  filter?: ((entry: string) => boolean) | RegExp | 'files' | 'dirs' | '*',
  depth?: number
): Array<string> {
  dir = resolve(dir);
  let _filter: ((entry: string) => boolean) | undefined;

  switch (filter) {
    case 'files': {
      _filter = (entry: string) => lstatSync(entry).isFile();

      break;
    }
    case 'dirs': {
      _filter = (entry: string) => lstatSync(entry).isDirectory();

      break;
    }
    case '*': {
      _filter = undefined;

      break;
    }
    default:
      if (filter instanceof RegExp) {
        _filter = (entry: string) => filter.test(entry);
      } else if (typeof filter === 'function') {
        _filter = filter;
      }
  }
  // todo: else if(typeof entry === 'string'){/* glob pattern */}

  let entries = readdirSync(dir);
  let result: Array<string> = [];

  for (let entry of entries) {
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
      result = [...result, ...subEntries];
    }
  }

  return result;
}

export type Filter = (path: string, type?: 'dir' | 'file') => boolean;
/**
 * recursively apply a function to a directory and all subdirectories
 *
 * @param path path to a file or directory
 * @param apply the function to be applied to each directory or file
 * @param filter
 * @returns if path is a dir: an array of apply() outputs, if path is file: output of apply()
 */
export function recursive(
  path: PathLike | PathLike[],
  apply: (path: string, type: 'dir' | 'file') => void,
  filter: Filter = () => true
): any | any[] {
  if (!path) {
    throw new Error('path not provided');
  }

  if (Array.isArray(path)) {
    return path.map((p: PathLike) => recursive(p, apply, filter));
  }

  path = resolve(path.toString());

  if (!existsSync(path)) {
    return;
  }

  let result: any[] = [];
  if (isDir(path)) {
    if (filter(path, 'dir')) {
      readdirSync(path).forEach((file: string) => {
        result.push(recursive(`${path}/${file}`, apply, filter));
      });
      apply(path, 'dir');
    }
  } else if (filter(path, 'file')) {
    return apply(path, 'file');
  }

  return result;
}
