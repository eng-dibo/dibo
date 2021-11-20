import { argv } from 'process';
import { exec, execSync as _execSync, ExecSyncOptions } from 'child_process';
import {
  Obj,
  chunk,
  stringToObject,
  objectType,
  flatten,
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
 * @param argvString
 * @param string
 */
export function parseArgv(args?: string | Array<string>): Argv {
  if (!args) {
    args = argv.slice(2);
  } else if (typeof args === 'string') {
    args = args.split(' ');
  }

  let argsObj: Argv = { cmd: [], options: {}, external: '' };

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
    if (argsObj.options[key]) {
      if (!(argsObj.options[key] instanceof Array)) {
        argsObj.options[key] = [argsObj.options[key]];
      }

      value = argsObj.options[key].concat(value);
    }

    // todo: if(key.indexOf('.')>-1) -> object
    // ex: 'a.b=1' -> {a: {b: 1}}
    if (key.indexOf('.') > -1) {
      // object
      let keys = key.split('.');
      key = keys.shift() as string;
      argsObj.options[key] = stringToObject(keys, value);
    } else {
      argsObj.options[key] = value;
    }
  };

  if (args.indexOf('--') !== -1) {
    let chunks = chunk(args, args.indexOf('--'));
    argsObj.external = chunks[1].slice(1).join(' ');
    args = chunks[0];
  }

  for (let i = 0; i < args.length; i++) {
    let arg = args[i].trim();

    // remove extra spaces between args
    if (arg === '') {
      continue;
    }
    // `--no-key` -> {key: false}
    if (/^--no-.+/.test(arg)) {
      let match = arg.match(/^--no-(.+)/),
        key = match![1];
      setOption(key, false);
    }
    // `--key=value`
    else if (/^--.+=/.test(arg)) {
      let match = arg.match(/^--([^=]+)=(.*)$/s),
        key = match![1],
        value = match![2];
      // todo: cast types
      // example: `--y=2` -> convert value to number
      setOption(key, value);
    }

    // `--key`
    else if (/^--.+/.test(arg)) {
      let match = arg.match(/^--(.+)/),
        key = match![1],
        next = args[i + 1];

      // if the next arg doesn't start with "--", treat it as the value of this key
      // else set key to true
      if (next !== undefined && !/^-/.test(next)) {
        // todo: cast 'boolean' to boolean
        // example: `--key true` -> {key: 'true'} -> {key: true}
        setOption(key, next);
        i++;
      } else {
        setOption(key, true);
      }
    }

    // shortcuts: `-a -bc -d value -e=value -fgh ok`
    // `-bc` is equivalent to `-b -c`
    // `-fgh ok` -> {f: true, h: true, h: 'ok'}
    else if (/^-[^-]+/.test(arg)) {
      // remove "-" & last letter, because the last letter will be depend on the next value.
      // ex: '-abcd' -> [a, b, c]
      let letters = arg.slice(1, -1).split('');

      // end of letters
      // ex: '-ab=cd' should break at 'b'
      let broken = false;
      for (let j = 0; j < letters.length; j++) {
        let next = arg.slice(j + 2);

        // '-a-' -> {a: '-'}
        // todo: '-ab-c'
        if (next === '-') {
          setOption(letters[j], '-');
          continue;
        }

        // '-a=1' -> {a: '1'}
        // '-abc=1' -> {a: true, b: true, c: '1'}
        if (/[A-Za-z]/.test(letters[j]) && /=/.test(next)) {
          setOption(letters[j], next.split('=')[1]);
          broken = true;
          break;
        }

        // next is number: '-1.2e-3'
        // todo: !Number.isNaN(next)
        // example: 'abc123' -> {a: true, b: true, c: 123}
        else if (
          /[A-Za-z]/.test(letters[j]) &&
          /-?\d+(\.\d*)?(e-?\d+)?$/.test(next)
        ) {
          setOption(letters[j], next);
          broken = true;
          break;
        }

        // if the next letter is non-word (i.e /\W/) equivalent to /[^a-zA-Z0-9_]/
        // set the current letter to the remaining characters as value
        else if (letters[j + 1] && letters[j + 1].match(/\W/)) {
          setOption(letters[j], arg.slice(j + 2));
          broken = true;
          break;
        } else {
          setOption(letters[j], true);
        }
      }

      // handling the last letter
      let key = arg.slice(-1)[0],
        next = args[i + 1];

      if (!broken && key !== '-') {
        // if the next element is not an option, consider it as a value of the current key
        if (next && !/^(-|--)[^-]/.test(next)) {
          setOption(key, next);
          i++;
        } else {
          setOption(key, true);
        }
      }
    } else {
      // add to cmd[]
      argsObj.cmd.push(arg);
    }
  }
  return argsObj;
}

/**
 * converts an argvObj to a cli argv string
 * @param argsObj
 */
export function toArgv(argsObj: Argv): string {
  let argv = '';

  argsObj.cmd.forEach((el) => {
    argv += el + ' ';
  });

  let setOption = function (key: string, value: any): string {
    let argv = '';
    if (value instanceof Array) {
      value.forEach((el) => {
        argv += `--${key}=${el} `;
      });
    } else {
      argv += `--${key}=${value} `;
    }
    return argv;
  };

  // consumer has to convert dash options, ex: convert `--a` to `-a`
  for (let key in argsObj.options) {
    if (argsObj.options.hasOwnProperty(key)) {
      let value = argsObj.options[key];
      if (objectType(value) === 'object') {
        // convert objects to a string with dot notation
        // {a: {b: 1}} -> 'a.b=1'
        Object.entries(flatten({ [key]: value })).forEach(([k, v]) => {
          argv += setOption(k, v);
        });
      } else {
        argv += setOption(key, value);
      }
    }
  }

  if (argsObj.external) {
    let external = argsObj.external.trim();
    if (external !== '') {
      argv += `-- ${argsObj.external}`;
    }
  }

  return argv;
}

/**
 * displays the output of the child process in the main std
 * @param cmd
 */
export function execSync(
  cmd: string,
  options?: ExecSyncOptions
): Buffer | string {
  let opts = Object.assign({ stdio: 'inherit' }, options || {});
  // display the output
  // https://stackoverflow.com/a/31104898/12577650
  // todo: don't wait until std complete to display the output
  // https://stackoverflow.com/a/30168821/12577650
  // using `{ stdio: 'inherit' })` this function displays the output and returns null
  return _execSync(cmd, opts);
}

/**
 * promisify exec()
 * @param cmd
 * @param options
 * @returns
 */
export function execPromise(cmd: string, options?: any): Promise<string> {
  let opts = Object.assign(
    { stdio: 'inherit', encoding: 'utf8' },
    options || {}
  );
  return new Promise((res, rej) => {
    exec(cmd, opts, (error: any, strout: any, stderr: any) => {
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
 * @param tasks
 * @param args
 * @example `node tasks.js mytask --option1=value`
 */

export async function runTask(
  tasks: Obj,
  args?: string | Array<string>
): Promise<void> {
  // let task = argv.slice(2)[0], params = argv.slice(3);

  let parsedArgs = parseArgv(args),
    task = parsedArgs.cmd[0],
    options = parsedArgs.options;

  if (!task) {
    throw new Error('task not provided!');
  } else if (!(task in tasks)) {
    throw new Error(`unknown task ${task}`);
  }

  try {
    console.log(`>> running the task: ${task}`);
    await tasks[task](options);
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
