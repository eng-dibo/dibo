/*
 see <root>/tasks
*/
import { runTask } from '@engineers/nodejs/process';
import { resolve } from 'node:path';
import deploy from './deploy';
import build from './build';

export let rootPath = resolve(__dirname, '../../..');
export let projectPath = resolve(__dirname, '..');
export let dist = resolve(__dirname, '../dist');

runTask({ deploy, build }).catch((error) => {
  console.log(`>> error in task ${error.task}: \n ${error}`);
});
