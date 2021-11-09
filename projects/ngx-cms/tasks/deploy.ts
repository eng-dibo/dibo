import { basename, resolve } from 'path';
import { ncp } from 'ncp';
import gcloudConfig, { GCloudConfig } from '~config/gcloud';
import { execSync } from '@engineers/nodejs/process';
import { remove } from '@engineers/nodejs/fs';

/**
 * build a docker image and deploy it to gcloud run
 * gcloud must be installed, run task: setup
 *
 * @param options overrides gcloudConfig
 */
// todo: detect if gcloud not installed, run task: setup
export default function (options?: GCloudConfig): Promise<any> {
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
  let image = `gcr.io/${gcloudConfig.projectId}/ngx-cms`,
    rootPath = resolve(__dirname, '../../..'),
    projectPath = resolve(__dirname, '..'),
    destination = `${rootPath}/dist/ngx-cms`;

  // copy the required files to build the container image
  return Promise.all(
    [
      `${projectPath}/Dockerfile`,
      `${projectPath}/package.json`,
      `${rootPath}/package-lock.json`,
    ].map((file) =>
      remove(`${destination}/${basename(file)}`).then(() =>
        copy(file, `${destination}/${basename(file)}`)
      )
    )
  )
    .then(() => {
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
    })
    .catch((err) => console.log({ err }));
}

/**
 * converts `ncp` into a promise
 * @param source
 * @param destination
 * @returns
 */
function copy(source: string, destination: string): Promise<void> {
  return new Promise((resolve, reject) => {
    ncp(source, destination, (error) => {
      console.log(`${source} copied to ${destination}`);
      error ? reject(error) : resolve();
    });
  });
}
