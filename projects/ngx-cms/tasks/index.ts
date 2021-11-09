/*
 see <root>/tasks
*/
import { runTask } from '@engineers/nodejs/process';
import setup from './setup';
import deploy from './deploy';

runTask({ setup, deploy });
