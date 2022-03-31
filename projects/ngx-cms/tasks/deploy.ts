import gcloudConfig, { GCloudConfig } from '~config/server/gcloud';
import cloudFlareConfig from '~config/server/cloudflare';
import { execSync } from '@engineers/nodejs/process';
import { execSync as _execSync } from 'child_process';
import setup from './setup';
import https from 'node:https';

/**
 * build a docker image and deploy it to gcloud run
 * gcloud must be installed, run task: setup
 *
 * @param options overrides gcloudConfig
 */
// todo: detect if gcloud not installed, run task: setup
export default function (options: GCloudConfig = {}): void {
  let opts: GCloudConfig = Object.assign({}, gcloudConfig || {}, options);

  opts.cloudRun = Object.assign(
    {},
    {
      name: 'cms-run',
      platform: 'managed',
      region: 'europe-west1',
      allowUnauthenticated: true,
    },
    gcloudConfig.cloudRun || {},
    options.cloudRun || {}
  );

  let image = `gcr.io/${opts.projectId}/${
    opts.cloudRun.image || opts.cloudRun.name
  }`;

  console.log(`> building the image ${image} ...`);
  execSync(`docker build . -t ${image}`);

  try {
    _execSync('gcloud version');
  } catch (err) {
    console.log('installing gcloud tools...');
    setup({ init: false });
  }

  if (!_execSync(`gcloud auth list --format="value(account)"`).toString()) {
    try {
      execSync(
        'gcloud auth activate-service-account --key-file=./config/server/gcloud-service-account.json'
      );
      console.log('gcloud service account activated');
      // todo: if !permissions throw error
      // check permissions for container registry
      // https://cloud.google.com/container-registry/docs/access-control#grant
    } catch (err) {
      console.log('login to gcloud');
      execSync('gcloud auth login --no-launch-browser');
    }

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

  console.log(`> purging cloudflare cache`);
  // @ts-ignore
  if (
    cloudFlareConfig.purge &&
    cloudFlareConfig.token &&
    cloudFlareConfig.zone
  ) {
    let options = {
      // https://stackoverflow.com/a/70377372/12577650
      protocol: 'https:',
      host: 'api.cloudflare.com',
      path: `/client/v4/zones/${cloudFlareConfig.zone}/purge_cache`,
      port: 443,
      method: 'POST',
      headers: {
        Authorization: `Bearer ${cloudFlareConfig.token}`,
        'Content-Type': 'application/json',
      },
    };

    var req = https.request(options, function (res) {
      res.setEncoding('utf8');
      res.on('data', function (chunk) {
        console.log(chunk);
      });
    });

    req.on('error', function (error) {
      console.error(`> [cloudflare] error:`, error);
    });

    req.write(JSON.stringify(cloudFlareConfig.purge));
    req.end();
  }

  console.log('Done');
}
