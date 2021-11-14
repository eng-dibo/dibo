import { basename, dirname } from 'path';
import gcloudConfig, { GCloudConfig } from '~config/server/gcloud';
import { execSync } from '@engineers/nodejs/process';
import { execSync as _execSync } from 'child_process';
import { copyFileSync } from 'fs';
import { rootPath, projectPath, destination } from './index';
import setup from './setup';
import { getEntries, mkdir } from '@engineers/nodejs/fs-sync';

/**
 * build a docker image and deploy it to gcloud run
 * gcloud must be installed, run task: setup
 *
 * @param options overrides gcloudConfig
 */
// todo: detect if gcloud not installed, run task: setup
export default function (options?: GCloudConfig): void {
  let opts: GCloudConfig = Object.assign(
    {
      runInstance: {
        name: 'cms-run',
        platform: 'managed',
        region: 'europe-west1',
        allowUnauthenticated: true,
      },
    },
    gcloudConfig || {},
    options || {}
  );

  let image = `gcr.io/${gcloudConfig.projectId}/ngx-cms`;

  // copy the required files to build the container image
  [
    `${projectPath}/Dockerfile`,
    `${projectPath}/package.json`,
    `${rootPath}/package-lock.json`,
  ].forEach((file) => copyFileSync(file, `${destination}/${basename(file)}`));

  // @engineers/* (i.e root/packages/*) are not available,
  // because config folder not bundled with `webpack`
  getEntries(`${rootPath}/packages`, 'files').forEach((file) => {
    let path = `${destination}/node_modules/@engineers/${file.replace(
        rootPath + '/packages/',
        ''
      )}`,
      dir = dirname(path);

    mkdir(dir);
    copyFileSync(file, path);
  });

  console.log(`> building the image ${image} ...`);
  execSync(`docker build ${rootPath}/dist/ngx-cms -t ${image}`);

  try {
    _execSync('gcloud');
  } catch (err) {
    console.log('installing gcloud tools...');
    setup({ init: false });
  }

  if (!_execSync(`gcloud auth list --format="value(account)"`).toString()) {
    console.log('login to gcloud');
    // todo: auto auth in ci (i.e: github actions), without a user action
    // or config/gcloud.auth= ${auth_key}
    execSync('gcloud auth login');
    // no need to run `gcloud init`
  }

  console.log('> pushing the image ...');
  execSync(`docker push ${image}`);

  console.log('> deploying ...');
  execSync(
    `gcloud run deploy ${
      opts.cloudRun.name
    } --image=${image} --port=4200 --project=${opts.projectId} --platform=${
      opts.cloudRun.platform
    } --region=${opts.cloudRun.region} ${
      opts.cloudRun.allowUnauthenticated ? '--allow-unauthenticated' : ''
    }`
  );

  console.log('Done');
}
