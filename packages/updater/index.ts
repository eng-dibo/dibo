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

export interface DownloadOptions {
  // files to be downloaded
  filter?: ((file: string) => boolean) | Array<RegExp | string>;
  destination?: string;
  // clean the destination before downloading
  clean?: boolean;
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
        { name: 'beforeUpdate', exec: beforeUpdate },
        { name: 'update', exec: update },
        { name: 'finish', exec: afterUpdate },
      ],
    },
  ]);
};

export function getLocalVersion(localPath?: string): Promise<string> {
  if (!localPath) {
    // todo: locate the nearest up-level package.json
    localPath = resolve(root.toString(), 'package.json');
  } else if (lstatSync(localPath).isDirectory()) {
    localPath = resolve(localPath, 'package.json');
  }
  if (!existsSync(localPath)) {
    Promise.reject(`path ${localPath} not found`);
  }
  // todo: save results in store{} to be used by other hooks
  return read(localPath).then((content: any) => content.version);
}

/**
 * get the remote package version from a github repo
 * it parses package.json in the code base, but may download the remote package from a release
 * @param remote
 * @returns
 */
export function getRemoteVersion(remote: Remote): Promise<string> {
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
export function compareVersions(
  localVersion: string,
  remoteVersion: string
): UpdateType {
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

// use cache()
// use post.download to validate the updating, if the update process is not safe stop the process
// and notify the admin about the new version and whether it could be auto updated
// or need admin attention and a migration guide
// use pre.download to decide if the update should be downloaded based on updateType level
export function download(
  remote: Remote,
  options?: DownloadOptions
): Promise<void> {
  let opts: DownloadOptions = Object.assign(
    {
      filter: () => true,
      // todo: default name =
      destination: `${process.cwd()}/.remote/${remote.repo}`,
    },
    options || {}
  );

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

// todo: get localPath and localVersion from getLocalVersion hook
export function backupLocalPackage(
  localPath?: string,
  destination?: string
): Promise<void> {
  if (!localPath) {
    localPath = root.toString();
  }

  if (lstatSync(localPath).isFile()) {
    localPath = dirname(localPath);
  }
  if (!existsSync(localPath)) {
    Promise.reject(`path ${localPath} not found`);
  }

  let version = '0.0.0';
  if (!destination) {
    destination = resolve(localPath, `.backup/${version}`);
  }
  remove(destination);
  return copy(localPath, destination, (path) => !path.includes('node_module'));
}
/**
 * transform and filter the downloaded package and run actions like notify the admin
 */
export function beforeUpdate(): Promise<void> {
  return Promise.resolve();
}
/**
 * the actual update process
 * @param localPath
 * @param remotePath
 */
export function update(localPath?: string, remotePath?: string): Promise<void> {
  return Promise.reject('todo: implement this function');
}
/**
 * install dependencies, finish the update process and restart the app
 */
export function afterUpdate(): Promise<void> {
  return Promise.reject('todo: implement this function');
}

/**
 * @deprecated
 * parse a github url
 * @param url
 */
export function parseGithubUrl(url: string) {
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
