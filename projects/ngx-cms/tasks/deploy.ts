import { basename, resolve } from 'path';
import { ncp } from 'ncp';
import { projectId } from '~config/gcloud';
import { execSync } from '@engineers/nodejs/process';

let image = `gcr.io/${projectId}/ngx-cms`;

let rootPath = resolve(__dirname, '../../..'),
  projectPath = resolve(__dirname, '..');

/**
 * build a docker image and deploy it to gcloud run
 */
export default function (): Promise<any> {
  let destination = `${rootPath}/dist/ngx-cms`;

  // copy the required files to build the container image
  return Promise.all(
    [
      `${projectPath}/Dockerfile`,
      `${projectPath}/package.json`,
      `${rootPath}/package-lock.json`,
    ].map((file) => ncp(file, `${destination}/${basename(file)}`))
  ).then(() => {
    console.log('login to gcloud');
    execSync('gcloud auth login');

    console.log(`> building the image ${image} ...`);
    execSync(`docker build ${rootPath}/dist/ngx-cms -t ${image}`);

    console.log('> pushing the image ...');
    execSync(`docker push ${image}`);

    console.log('> deploying ...');
    execSync(
      `gcloud run deploy cms-run --image=${image} --platform=managed --port=4200 --region=europe-west1 --allow-unauthenticated`
    );

    console.log('Done');
  });
}
