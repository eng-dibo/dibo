import gcloudConfig, { GCloudConfig } from '~config/server/gcloud';
import { execSync } from '@engineers/nodejs/process';
import { execSync as _execSync } from 'node:child_process';
import setup from './setup';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import webPush, { VapidKeys } from 'web-push';
import { write, read } from '@engineers/nodejs/fs-sync';

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

  console.log(`> building the image ${image} ...`);
  execSync(`docker build . -t ${image}`);

  try {
    _execSync('gcloud version');
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
