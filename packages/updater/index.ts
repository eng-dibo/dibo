import Hookable from '@engineers/hookable';
import { Filter, copy, read, remove } from '@engineers/nodejs/fs';

import { dirname, resolve } from 'node:path';
import { existsSync, lstatSync } from 'node:fs';
// be sure that 'app-root-path' installed in the root's node_module folder
// not in any subfolder, otherwise you eed to calculate the relative paths
// between the root and the dir where 'app-root-path' is installed
import root from 'app-root-path';
import request from '@engineers/nodejs/https';
import git from 'simple-git';

export type UpdateType = 'patch' | 'minor' | 'major' | undefined;
export interface UpdaterOptions {
  remote: Remote;
  // filter files and dirs to be removed when cleaning the localPath before the update
  cleanFilter?: Filter;
  // files and dirs to be copied from the downloaded update
  copyFilter?: Filter;
  // path of local package
  localPath?: string;
  // path to download the remote package, default= (localPath||cwd()).remote
  remotePath?: string;
  // path to save a backup of the local package
  // default = localPackage.backup/$localVersion
  backupPath?: string;
}
export interface Remote {
  // example: $username/$repo
  repo: string;
  // default=master
  branch?: string;
  // default=latest
  release?: string | false;
  token?: string;
}

// todo: pass options to each hook
// each hook has its own options
// hook= (options)=>function
// run: updater(options).run()
export default (options: UpdaterOptions): Hookable => {
  let opts: UpdaterOptions = Object.assign({}, options || {});
  opts.remote = Object.assign(
    {
      release: 'latest',
      branch: 'master',
    },
    opts.remote || {}
  );

  return new Hookable([
    {
      name: 'checkUpdates',
      hooks: [
        {
          name: 'getLocalVersion',
          exec: getLocalVersionHook,
          options: options.localPath,
        },
        {
          name: 'getRemoteVersion',
          exec: getRemoteVersionHook,
          options: options.remote,
        },
        { name: 'compareVersions', exec: compareVersionsHook },
      ],
    },
    {
      // todo: add beforeAll() to check if the update should be downloaded
      name: 'download',
      hooks: [
        {
          name: 'download',
          exec: downloadHook,
          options: { remote: options.remote, remotePath: options.remotePath },
        },
      ],
    },
    {
      name: 'update',
      hooks: [
        // if the runner runs all hooks in parallel use
        // `{ beforeAll: backupLocalPackage, afterAll: finishUpdate }`
        // todo: add beforeAll() to check if the update should be installed, remove beforeUpdate
        {
          name: 'backup',
          exec: backupLocalPackageHook,
          options: {
            localPath: options.localPath,
            backupPath: options.backupPath,
          },
        },
        { name: 'beforeUpdate', exec: beforeUpdateHook },
        { name: 'update', exec: updateHook, options },
        { name: 'finish', exec: afterUpdateHook },
      ],
    },
  ]);
};

export interface Object_ {
  [key: string]: any;
}

/**
 *
 * @param localPath
 * @param pointName
 * @param store
 */
export function getLocalVersionHook(
  localPath: string | undefined,
  pointName: string,
  store: Object_
): Promise<string> {
  // todo: locate the nearest up-level package.json
  localPath = localPath || store['localPath'] || root.toString();
  // save to store, so other hooks can use it
  // todo: if(file)dirname(localPath)
  store['localPath'] = localPath;
  if (lstatSync(localPath!).isDirectory()) {
    localPath = resolve(localPath!, 'package.json');
  }
  if (!existsSync(localPath!)) {
    Promise.reject(`path ${localPath} not found`);
  }
  // todo: save results in store{} to be used by other hooks
  return read(localPath!).then((content: any) => content.version);
}

/**
 * get the remote package version from a github repo
 * it parses package.json in the code base, but may download the remote package from a release
 *
 * @param remote
 * @param pointName
 * @param store
 * @returns
 */
export function getRemoteVersionHook(
  remote: Remote,
  pointName: string,
  store: Object_
): Promise<string> {
  let url = `https://raw.githubusercontent.com/${remote.repo}/${
    remote.branch || 'master'
  }/package.json`;

  let requestOptions: any = {};
  if (remote.token) {
    requestOptions.headers = { Authorization: `token ${remote.token}` };
  }

  return request(url, undefined, requestOptions).then(
    (content) => JSON.parse(content).version
  );
}

export interface CompareVersionsOptions {
  localVersion: string;
  remoteVersion: string;
}
/**
 *
 * @param options
 * @param pointName
 * @param store
 */
export function compareVersionsHook(
  options: CompareVersionsOptions,
  pointName: string,
  store: Object_
): UpdateType {
  let opts: CompareVersionsOptions = Object.assign(
    {
      localVersion: store['checkUpdates']?.['getLocalVersion'],
      remoteVersion: store['checkUpdates']?.['getRemoteVersion'],
    },
    options || {}
  );

  let { localVersion, remoteVersion } = opts;

  if (
    !/\d+\.\d+\.\d+/.test(localVersion) ||
    !/\d+\.\d+\.\d+/.test(remoteVersion)
  ) {
    throw new Error(`wrong versions ${localVersion} & ${remoteVersion}`);
  }
  let [localMajor, localMinor, localPatch] = localVersion.split('.'),
    [remoteMajor, remoteMinor, remotePatch] = remoteVersion.split('.');

  if (remoteMajor > localMajor) return 'major';
  else if (remoteMinor > localMinor) return 'minor';
  else if (remotePatch > localPatch) return 'patch';
  return;
}

export interface DownloadOptions {
  remote: Remote;
  // files to be downloaded
  filter?: ((file: string) => boolean) | Array<RegExp | string>;
  // path to download the remote package
  remotePath?: string;
  // clean the remotePath before downloading
  clean?: boolean;
}

// todo: use cache()
// use post.download to validate the updating, if the update process is not safe stop the process
// and notify the admin about the new version and whether it could be auto updated
// or need admin attention and a migration guide
// use pre.download to decide if the update should be downloaded based on updateType level
/**
 *
 * @param options
 * @param pointName
 * @param store
 */
export function downloadHook(
  options: DownloadOptions,
  pointName: string,
  store: Object_
): Promise<string> {
  let remoteVersion = store['checkUpdates']?.['getRemoteVersion'] || '0.0.0';
  let opts: DownloadOptions = Object.assign(
    {
      filter: () => true,
      remotePath: `${store.localPath || process.cwd()}/.remote/${
        options.remote.repo
      }/v${remoteVersion}`,
      remoteVersion,
    },
    options || {}
  );

  let { remote, filter } = opts;

  // todo: convert to function
  if (Array.isArray(filter)) {
  }

  if (remote.token) {
    // todo: `https://${remote.token}@${repo}`
  }

  if (remote.release !== false) {
    // download from  assets from a release
    // todo: if remote.release not provided (i.e undefined) fallback to clone the repo
    let url = `https://api.github.com/repos/${remote.repo}/releases/${
      remote.release || 'latest'
    }`;

    let requestOptions: any = {
      headers: { 'User-Agent': '@engineers/updater' },
    };
    if (remote.token) {
      requestOptions.headers.Authorization = `token ${remote.token}`;
    }

    // todo: use opts.filter to download only selected assets
    return (
      opts.clean !== false && existsSync(opts.remotePath!)
        ? remove(opts.remotePath!)
        : Promise.resolve()
    )
      .then(() =>
        request(url, undefined, requestOptions)
          .then((response) => response.tag_name)
          .then((tag) =>
            git().clone(
              `https://${remote.token ? remote.token + '@' : ''}github.com/${
                remote.repo
              }`,
              opts.remotePath!,
              [`--branch=${tag}`]
            )
          )
      )
      .then(() => opts.remotePath!);
  } else {
    // todo: clone the repo, then extract the project's path (if monorepo)
    return (
      opts.clean !== false && existsSync(opts.remotePath!)
        ? remove(opts.remotePath!)
        : Promise.resolve()
    )
      .then(() =>
        git().clone(
          `https://${remote.token ? remote.token + '@' : ''}github.com/${
            remote.repo
          }`,
          opts.remotePath!,
          [`--branch=${remote.branch}`]
        )
      )
      .then(() => opts.remotePath!);
  }
}

export interface BackupLocalPackageHookOptions {
  localPath?: string;
  backupPath?: string;
}

/**
 * backup the local package before performing the update
 *
 * @param options
 * @param pointName
 * @param store
 * @returns the backup destination dir (remotePath)
 */
// todo: get localPath and localVersion from getLocalVersion hook
export function backupLocalPackageHook(
  options: BackupLocalPackageHookOptions,
  pointName: string,
  store: Object_
): Promise<string> {
  let localVersion =
    store['checkUpdates']?.['getLocalVersionVersion'] || '0.0.0';
  if (!options.localPath) {
    options.localPath = store.localPatch || root.toString();
  }

  if (!options.backupPath) {
    options.backupPath = resolve(options.localPath!, `.backup/${localVersion}`);
  }

  let { localPath, backupPath } = options;

  if (lstatSync(localPath!).isFile()) {
    localPath = dirname(localPath!);
  }
  if (!existsSync(localPath!)) {
    Promise.reject(`path ${localPath} not found`);
  }

  return remove(backupPath)
    .then(() =>
      copy(localPath!, backupPath, (path) => !path.includes('node_module'))
    )
    .then(() => backupPath);
}
/**
 * transform and filter the downloaded package and run actions like notify the admin
 *
 * @param options
 * @param pointName
 * @param store
 */
export function beforeUpdateHook(
  options: any,
  pointName: string,
  store: Object_
): Promise<void> {
  return Promise.resolve();
}

export interface UpdateHookOptions {
  remotePath: string;
  localPath?: string;
  cleanFilter?: Filter;
  copyFilter?: Filter;
}
/**
 * the actual update process, copies files from remotePath to localPath
 *
 * @param localPath
 * @param remotePath
 * @param options
 * @param pointName
 * @param store
 */
export function updateHook(
  options: UpdateHookOptions,
  pointName: string,
  store: Object_
): Promise<void> {
  let opts = Object.assign({ cleanFilter: () => true }, options);
  opts.localPath = opts.localPath || store['localPath'] || root.toString();
  opts.remotePath = opts.remotePath || store['download']?.['download'];
  let backupPath = store['update']?.['backup'];

  opts.remotePath = opts.localPath + '/.remote';
  if (!opts.remotePath) {
    throw new Error(`remotePath not provided`);
  }
  // clean the localPath except remotePath and backupPath
  return remove(
    opts.localPath!,
    (path, type) =>
      opts.cleanFilter(path, type) &&
      ![opts.remotePath, backupPath].includes(path)
  ).then(() => copy(opts.remotePath, opts.localPath!, opts.copyFilter));
}
/**
 * install dependencies, adjust configs, finish the update process and restart the app
 */
export function afterUpdateHook(): Promise<void> {
  return Promise.resolve();
}

/**
 * @deprecated
 * parse a github url
 * @param url
 */
export function parseGithubUrlHook(url: string) {
  /*
    - may start with https?://github.com/
    - followed by $username/$repo
    - and may be followed by a $path (for monorepos) then a filename (for file paths)
  */
  let match = url.match(
    /(?:(?:https?:\/\/)?github.com\/)?([^/]+)\/([^/]+)(.+)/
  );
  if (match) {
    return {
      username: match[1],
      repo: match[2],
      path: match[3],
    };
  }
  return;
}
