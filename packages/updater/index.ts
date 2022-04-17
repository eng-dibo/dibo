export type UpdateType = 'patch' | 'minor' | 'major' | undefined;
export interface Options {}
export interface Remote {}

// todo: use hooks to run the steps
// todo: use pre.$step and post.$step to stop the process at any time
// use pre._ and post._ to run hooks before or after the whole process
export default (options: Options): void => {
  Promise.all([getLocalVersion(), getRemoteVersion()])

    .then(([localVersion, remoteVersion]) =>
      compareVersions(localVersion, remoteVersion)
    )
    // use cache()
    // use post.download to validate the updating, if the update process is not safe stop the process
    // and notify the admin about the new version and whether it could be auto updated
    // or need admin attention and a migration guide
    // use pre.download to decide if the update should be downloaded based on updateType level
    .then(() => download())
    .then(() => backupLocalPackage())
    // the actual update process
    // todo: use post.update hook to install dependencies, finish the update process and restart the app
    // and pre.update hook to transform and filter the downloaded package and run actions like notify the admin
    .then(() => update());
};

export function getLocalVersion(localPath?: string): string | Promise<string> {
  return '0.0.0';
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
export function download(remote?: Remote): any {}
export function backupLocalPackage(localPath?: string): void | Promise<void> {}
export function update(
  localPath?: string,
  remotePath?: string
): void | Promise<void> {}
