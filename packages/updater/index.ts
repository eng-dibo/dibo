import Hookable from '@engineers/hookable';
import { read, copy } from '@engineers/nodejs/fs';
import { remove } from '@engineers/nodejs/fs-sync';
import { dirname, resolve } from 'node:path';
import { existsSync, lstatSync } from 'node:fs';
// be sure that 'app-root-path' installed in the root's node_module folder
// not in any subfolder, otherwise you eed to calculate the relative paths
// between the root and the dir where 'app-root-path' is installed
import root from 'app-root-path';
import request from '@engineers/nodejs/https';
import git from 'simple-git';

export type UpdateType = 'patch' | 'minor' | 'major' | undefined;
export interface Options {
  remote: Remote;
  [key: string]: any;
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
export default (options: Options): Hookable => {
  let opts: Options = Object.assign({}, options || {});
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
        {
          name: 'compareVersions',
          exec: compareVersionsHook,
          // todo: get localVersion from Hookable.store{}
          options: { localVersion: '', remoteVersion: '' },
        },
      ],
    },
    {
      name: 'download',
      hooks: [
        {
          name: 'download',
          exec: downloadHook,
          options: options.remote,
        },
      ],
    },
    {
      name: 'update',
      hooks: [
        // if the runner runs all hooks in parallel use
        // `{ beforeAll: backupLocalPackage, afterAll: finishUpdate }`
        { name: 'backup', exec: backupLocalPackageHook },
        { name: 'beforeUpdate', exec: beforeUpdateHook },
        { name: 'update', exec: updateHook },
        { name: 'finish', exec: afterUpdateHook },
      ],
    },
  ]);
};

export interface Obj {
  [key: string]: any;
}

export function getLocalVersionHook(
  localPath: string | undefined,
  pointName: string,
  store: Obj
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
 * @param remote
 * @returns
 */
export function getRemoteVersionHook(
  remote: Remote,
  pointName: string,
  store: Obj
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
export function compareVersionsHook(
  options: CompareVersionsOptions,
  pointName: string,
  store: Obj
): UpdateType {
  let { localVersion, remoteVersion } = options;

  localVersion = localVersion || store['checkUpdates']['getLocalVersion'];
  remoteVersion = remoteVersion || store['checkUpdates']['getRemoteVersion'];

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
  destination?: string;
  // clean the destination before downloading
  clean?: boolean;
}

// todo: use cache()
// use post.download to validate the updating, if the update process is not safe stop the process
// and notify the admin about the new version and whether it could be auto updated
// or need admin attention and a migration guide
// use pre.download to decide if the update should be downloaded based on updateType level
export function downloadHook(
  options: DownloadOptions,
  pointName: string,
  store: Obj
): Promise<void> {
  let remoteVersion = store['checkUpdates']['getRemoteVersion'] || '0.0.0';
  let opts: DownloadOptions = Object.assign(
    {
      filter: () => true,
      // todo: .remote/$repo/{{checkUpdates.store.getRemoteVersion}}
      destination: `${process.cwd()}/.remote/${
        options.remote.repo
      }/v${remoteVersion}`,
      remoteVersion,
    },
    options || {}
  );

  let { remote } = opts;

  // todo: convert to function
  if (opts.filter instanceof Array) {
  }

  opts.clean !== false &&
    existsSync(opts.destination!) &&
    remove(opts.destination!);

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
    return request(url, undefined, requestOptions)
      .then((response) => response.tag_name)
      .then((tag) =>
        git().clone(
          `https://${remote.token ? remote.token + '@' : ''}github.com/${
            remote.repo
          }`,
          opts.destination!,
          [`--branch=${tag}`],
          (error) => (error ? Promise.reject(error) : Promise.resolve())
        )
      )
      .then(() => {
        /*void*/
      });
  } else {
    // todo: clone the repo, then extract the project's path (if monorepo)

    return new Promise((resolve, reject) => {
      git().clone(
        `https://${remote.token ? remote.token + '@' : ''}github.com/${
          remote.repo
        }`,
        opts.destination!,
        [`--branch=${remote.branch}`],
        (error) => (error ? reject(error) : resolve())
      );
    });
  }
}

export interface BackupLocalPackageHookOptions {
  localPath?: string;
  destination?: string;
}

// todo: get localPath and localVersion from getLocalVersion hook
export function backupLocalPackageHook(
  options: BackupLocalPackageHookOptions,
  pointName: string,
  store: Obj
): Promise<void> {
  let { localPath, destination } = options;
  if (!localPath) {
    localPath = store.localPatch || root.toString();
  }

  if (lstatSync(localPath!).isFile()) {
    localPath = dirname(localPath!);
  }
  if (!existsSync(localPath!)) {
    Promise.reject(`path ${localPath} not found`);
  }

  let version = '0.0.0';
  if (!destination) {
    destination = resolve(localPath!, `.backup/${version}`);
  }
  remove(destination);
  return copy(localPath!, destination, (path) => !path.includes('node_module'));
}
/**
 * transform and filter the downloaded package and run actions like notify the admin
 */
export function beforeUpdateHook(
  options: any,
  pointName: string,
  store: Obj
): Promise<void> {
  return Promise.resolve();
}

export interface UpdateHookOptions {
  remotePath: string;
  localPath?: string;
  filter?: (file: string) => boolean;
}
/**
 * the actual update process
 * @param localPath
 * @param remotePath
 */
export function updateHook(
  options: UpdateHookOptions,
  pointName: string,
  store: Obj
): Promise<void> {
  let { localPath, remotePath, filter } = options;

  localPath = localPath || store['localPath'] || root.toString();

  remove(localPath!);
  return copy(remotePath, localPath!, filter);
}
/**
 * install dependencies, adjust configs, finish the update process and restart the app
 */
export function afterUpdateHook(): Promise<void> {
  return Promise.reject('todo: implement this function');
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
    /(?:(?:https?:\/\/)?github.com\/)?([^\/]+)\/([^\/]+)(.+)/
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
