import Hookable from '@engineers/hookable';
import { read } from '@engineers/nodejs/fs';
import { resolve } from 'node:path';
import { existsSync, lstatSync } from 'node:fs';
// be sure that 'app-root-path' installed in the root's node_module folder
// not in any subfolder, otherwise you eed to calculate the relative paths
// between the root and the dir where 'app-root-path' is installed
import root from 'app-root-path';

export type UpdateType = 'patch' | 'minor' | 'major' | undefined;
export interface Options {
  remote: Remote;
  [key: string]: any;
}
export interface Remote {
  // example: github
  type: string;
  repo: string;
  // default=latest
  tagName?: string;
  // if true, use the release that matches the provided tagName instead of the source code
  useRelease?: boolean;
}

// todo: pass options to each hook
// each hook has its own options
// hook= (options)=>function
export default (options: Options): Hookable =>
  new Hookable([
    {
      name: 'checkUpdates',
      hooks: [
        {
          name: 'getLocalVersion',
          exec: getLocalVersion,
          options: options.localPath,
        },
        {
          name: 'getRemoteVersion',
          exec: getRemoteVersion,
          options: options.remote,
        },
        { name: 'compareVersions', exec: compareVersions },
      ],
    },
    {
      name: 'download',
      hooks: [
        {
          name: 'download',
          exec: download,
          options: options.remote,
        },
      ],
    },
    {
      name: 'update',
      hooks: [
        // if the runner runs all hooks in parallel use
        // `{ beforeAll: backupLocalPackage, afterAll: finishUpdate }`
        { name: 'backup', exec: backupLocalPackage },
        { name: 'update', exec: update },
        { name: 'finish', exec: finishUpdate },
      ],
    },
  ]);

export function getLocalVersion(localPath?: string): string | Promise<string> {
  if (!localPath) {
    localPath = resolve(root, 'package.json');
  } else if (lstatSync(localPath).isDirectory()) {
    localPath = resolve(localPath, 'package.json');
  }
  if (!existsSync(localPath)) {
    throw new Error(`path ${localPath} not found`);
  }
  return read(localPath).then((content: any) => content.version);
}
export function getRemoteVersion(remote?: Remote): string | Promise<string> {
  return '0.0.0';
}
export function compareVersions(
  localVersion: string,
  remoteVersion: string
): UpdateType | Promise<UpdateType> {
  return;
}

// use cache()
// use post.download to validate the updating, if the update process is not safe stop the process
// and notify the admin about the new version and whether it could be auto updated
// or need admin attention and a migration guide
// use pre.download to decide if the update should be downloaded based on updateType level
export function download(remote?: Remote): any {}
export function backupLocalPackage(localPath?: string): void | Promise<void> {}
/**
 * transform and filter the downloaded package and run actions like notify the admin
 */
export function transform(): any {}
/**
 * the actual update process
 * @param localPath
 * @param remotePath
 */
export function update(
  localPath?: string,
  remotePath?: string
): void | Promise<void> {}
/**
 * install dependencies, finish the update process and restart the app
 */
export function finishUpdate(): void {}
