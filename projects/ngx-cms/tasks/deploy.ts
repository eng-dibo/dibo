import { basename } from 'path';
import gcloudConfig, { GCloudConfig } from '~config/gcloud';
import { execSync } from '@engineers/nodejs/process';
import { copyFileSync } from 'fs';
import { rootPath, projectPath, destination } from './index';

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

  console.log('login to gcloud');
  // todo: only if not signed
  // use `gcloud auth list --filter=status:ACTIVE --format="value(account)"`
  // todo: auto auth in ci (i.e: github actions)
  execSync('gcloud auth login');

  console.log(`> building the image ${image} ...`);
  execSync(`docker build ${rootPath}/dist/ngx-cms -t ${image}`);

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
