import { argv } from 'node:process';
import {
  ExecSyncOptions,
  execSync as _execSync,
  exec,
} from 'node:child_process';
import {
  Obj,
  chunk,
  flatten,
  objectType,
  stringToObject,
} from '@engineers/javascript/objects';
import { toNumber } from '@engineers/javascript/string';

export interface Argv {
  // list of commands (i.e: non-options)
  cmd: Array<string>;

  // list of options, examples: --x=1 --y --no-z -a -bc
  options: Obj;

  // list op options after '--'.
  external: string;
}

/**
 * parses cli strings into objects
 *
 * @param argvString
 * @param string
 * @param args
 * @param arguments_
 * @returns
 */
export function parseArgv(arguments_?: string | Array<string>): Argv {
  if (!arguments_) {
    arguments_ = argv.slice(2);
  } else if (typeof arguments_ === 'string') {
    arguments_ = arguments_.split(' ');
  }

  let argumentsObject: Argv = { cmd: [], options: {}, external: '' };

  let setOption = (key: string, value: any) => {
    if (typeof value === 'string') {
      if (value === 'true') {
        value = true;
      } else if (value === 'false') {
        value = false;
      } else {
        // convert to a number if possible
        value = toNumber(value);
      }
    }
    if (argumentsObject.options[key]) {
      if (!Array.isArray(argumentsObject.options[key])) {
        argumentsObject.options[key] = [argumentsObject.options[key]];
      }

      value = argumentsObject.options[key].concat(value);
    }

    // todo: if(key.indexOf('.')>-1) -> object
    // ex: 'a.b=1' -> {a: {b: 1}}
    if (key.includes('.')) {
      // object
      let keys = key.split('.');
      key = keys.shift() as string;
      argumentsObject.options[key] = stringToObject(keys, value);
    } else {
      argumentsObject.options[key] = value;
    }
  };

  if (arguments_.includes('--')) {
    let chunks = chunk(arguments_, arguments_.indexOf('--'));
    argumentsObject.external = chunks[1].slice(1).join(' ');
    arguments_ = chunks[0];
  }

  for (let index = 0; index < arguments_.length; index++) {
    let argument = arguments_[index].trim();

    // remove extra spaces between args
    if (argument === '') {
      continue;
    }
    // `--no-key` -> {key: false}
    if (/^--no-.+/.test(argument)) {
      let match = argument.match(/^--no-(.+)/),
        key = match![1];
      setOption(key, false);
    }
    // `--key=value`
    else if (/^--.+=/.test(argument)) {
      let match = argument.match(/^--([^=]+)=(.*)$/s),
        key = match![1],
        value = match![2];
      // todo: cast types
      // example: `--y=2` -> convert value to number
      setOption(key, value);
    }

    // `--key`
    else if (/^--.+/.test(argument)) {
      let match = argument.match(/^--(.+)/),
        key = match![1],
        next = arguments_[index + 1];

      // if the next arg doesn't start with "--", treat it as the value of this key
      // else set key to true
      if (next !== undefined && !next.startsWith('-')) {
        // todo: cast 'boolean' to boolean
        // example: `--key true` -> {key: 'true'} -> {key: true}
        setOption(key, next);
        index++;
      } else {
        setOption(key, true);
      }
    }

    // shortcuts: `-a -bc -d value -e=value -fgh ok`
    // `-bc` is equivalent to `-b -c`
    // `-fgh ok` -> {f: true, h: true, h: 'ok'}
    else if (/^-[^-]+/.test(argument)) {
      // remove "-" & last letter, because the last letter will be depend on the next value.
      // ex: '-abcd' -> [a, b, c]
      let letters = argument.slice(1, -1).split('');

      // end of letters
      // ex: '-ab=cd' should break at 'b'
      let broken = false;
      for (let index_ = 0; index_ < letters.length; index_++) {
        let next = argument.slice(index_ + 2);

        // '-a-' -> {a: '-'}
        // todo: '-ab-c'
        if (next === '-') {
          setOption(letters[index_], '-');
          continue;
        }

        // '-a=1' -> {a: '1'}
        // '-abc=1' -> {a: true, b: true, c: '1'}
        if (/[A-Za-z]/.test(letters[index_]) && /=/.test(next)) {
          setOption(letters[index_], next.split('=')[1]);
          broken = true;
          break;
        }

        // next is number: '-1.2e-3'
        // todo: !Number.isNaN(next)
        // example: 'abc123' -> {a: true, b: true, c: 123}
        else if (
          /[A-Za-z]/.test(letters[index_]) &&
          /-?\d+(?:\.\d*)?(?:e-?\d+)?$/.test(next)
        ) {
          setOption(letters[index_], next);
          broken = true;
          break;
        }

        // if the next letter is non-word (i.e /\W/) equivalent to /[^a-zA-Z0-9_]/
        // set the current letter to the remaining characters as value
        else if (letters[index_ + 1] && /\W/.test(letters[index_ + 1])) {
          setOption(letters[index_], argument.slice(index_ + 2));
          broken = true;
          break;
        } else {
          setOption(letters[index_], true);
        }
      }

      // handling the last letter
      let key = argument.slice(-1)[0],
        next = arguments_[index + 1];

      if (!broken && key !== '-') {
        // if the next element is not an option, consider it as a value of the current key
        if (next && !/^(?:-|--)[^-]/.test(next)) {
          setOption(key, next);
          index++;
        } else {
          setOption(key, true);
        }
      }
    } else {
      // add to cmd[]
      argumentsObject.cmd.push(argument);
    }
  }
  return argumentsObject;
}

/**
 * converts an argvObj to a cli argv string
 *
 * @param argsObj
 * @param argumentsObject
 */
export function toArgv(argumentsObject: Argv): string {
  let argv = '';

  for (let element of argumentsObject.cmd) {
    argv += element + ' ';
  }

  let setOption = function (key: string, value: any): string {
    let argv = '';
    if (Array.isArray(value)) {
      for (let element of value) {
        argv += `--${key}=${element} `;
      }
    } else {
      argv += `--${key}=${value} `;
    }
    return argv;
  };

  // consumer has to convert dash options, ex: convert `--a` to `-a`
  for (let key in argumentsObject.options) {
    if (argumentsObject.options.hasOwnProperty(key)) {
      let value = argumentsObject.options[key];
      if (objectType(value) === 'object') {
        // convert objects to a string with dot notation
        // {a: {b: 1}} -> 'a.b=1'
        for (let [k, v] of Object.entries(flatten({ [key]: value }))) {
          argv += setOption(k, v);
        }
      } else {
        argv += setOption(key, value);
      }
    }
  }

  if (argumentsObject.external) {
    let external = argumentsObject.external.trim();
    if (external !== '') {
      argv += `-- ${argumentsObject.external}`;
    }
  }

  return argv;
}

/**
 * displays the output of the child process in the main std
 *
 * @param cmd
 * @param options
 */
export function execSync(
  cmd: string,
  options?: ExecSyncOptions
): Buffer | string {
  let options_ = Object.assign({ stdio: 'inherit' }, options || {});
  // display the output
  // https://stackoverflow.com/a/31104898/12577650
  // todo: don't wait until std complete to display the output
  // https://stackoverflow.com/a/30168821/12577650
  // using `{ stdio: 'inherit' })` this function displays the output and returns null
  return _execSync(cmd, options_);
}

/**
 * promisify exec()
 *
 * @param cmd
 * @param options
 * @returns
 */
export function execPromise(cmd: string, options?: any): Promise<string> {
  let options_ = Object.assign(
    { stdio: 'inherit', encoding: 'utf8' },
    options || {}
  );
  return new Promise((res, rej) => {
    exec(cmd, options_, (error: any, strout: any, stderr: any) => {
      if (error) {
        error.message = stderr;
        rej(error);
      } else {
        res(strout);
      }
    });
  });
}

/**
 * run a task from tasks list from a cli cmd
 *
 * @param tasks
 * @param args
 * @example `node tasks.js mytask --option1=value`
 */

/**
 *
 * @param tasks
 * @param arguments_
 */
export async function runTask(
  tasks: Obj,
  arguments_?: string | Array<string>
): Promise<void> {
  // let task = argv.slice(2)[0], params = argv.slice(3);

  let parsedArguments = parseArgv(arguments_),
    task = parsedArguments.cmd.shift();

  if (!task) {
    throw new Error('task not provided!');
  } else if (!(task in tasks)) {
    throw new Error(`unknown task ${task}`);
  }

  try {
    let optionsString = '';
    for (let key in parsedArguments.options) {
      optionsString += `--${key}=${parsedArguments.options[key]} `;
    }
    console.log(
      `>> running the task: ${task} ${parsedArguments.cmd.join(
        ' '
      )} ${optionsString}`
    );
    await tasks[task](...parsedArguments.cmd, parsedArguments.options);
    console.log('>> Done');
  } catch (error: any) {
    error.task = task;
    throw error;
  }
}

/*
let obj = parseArgv();
let args = toArgv(obj);
console.log({ obj, args });
*/
