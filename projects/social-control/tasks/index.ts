/*
 see <root>/tasks
*/
import { runTask } from '@engineers/nodejs/process';
import { resolve } from 'path';
import setup from './setup';
import deploy from './deploy';
import build from './build';

export let rootPath = resolve(__dirname, '../../..');
export let projectPath = resolve(__dirname, '..');
export let dist = resolve(__dirname, './dist');

runTask({ setup, deploy, build }).catch((error) => {
  console.log(`>> error in task ${error.task}: \n ${error}`);
});
