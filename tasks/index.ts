/*

build tasks by one of the following methods:
- tsc:  generates many files, `tsc file.ts` ignores tsconfig.json
- webpack: to combine all the dependencies in one file, and control the output path
- ts-node: to compile .ts files in memory, so we don't need to build and use the outputted files

if you build tasks using `npm run tasks:build`:
- add the generated tasks.js file to .gitignore or add '~~' or '!!' to the end of its name
  i.e: tasks~~.js
- output to the workspace's root to make all relative paths resolves to it
  or use absolute paths
- using `ts-node`, we don't need to build tasks first.

example:
 `npm run task generate`
*/
import { runTask } from '@engineers/nodejs/process';
import generate from './generate';
import link from './link-local-dependencies';
import maintenance from './maintenance';

runTask({ maintenance, generate, link });
