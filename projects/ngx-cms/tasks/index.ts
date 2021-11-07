/*
 see <root>/tasks
*/
import { runTask } from '@engineers/nodejs/process';
import deploy from './deploy';

runTask({ deploy });
