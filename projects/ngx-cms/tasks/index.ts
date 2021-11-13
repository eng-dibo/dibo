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
export let destination = `${rootPath}/dist/ngx-cms`;

runTask({ setup, deploy, build });
