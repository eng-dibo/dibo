import { execPromise, execSync } from '@engineers/nodejs/process';
import { mkdir, write } from '@engineers/nodejs/fs-sync';
import {
  readdirSync,
  lstatSync,
  existsSync,
  copyFileSync,
  writeFileSync,
} from 'fs';
import { basename } from 'path';
import { rootPath, projectPath, destination } from './index';

let time = Date.now();

export type Mode = 'production' | 'development' | 'test';
export interface BuildOptions {
  targets?: string | Array<string>;
  mode?: Mode;
  // for buildConfig
  // if `js`, use webpack to generate js bundles
  // otherwise, copy files from source as .ts, use `node-ts`to run the server
  // webpack produces a non-human readable output, as an alternative use ts-node to run from .ts files directly
  // example: > `cross-env BUILD_OUTPUT=js npm run task -- build --targets=config`
  output?: 'ts' | 'js';
}

export default function (options?: BuildOptions): void {
  let opts = Object.assign(
    {
      targets: process.env.BUILD_TARGETS || 'browser,server,config,package',
      mode: process.env.NODE_ENV || 'production',
      output: process.env.BUILD_OUTPUT || 'ts',
    },
    options || {}
  );

  let progress: Promise<any> = Promise.resolve();

  let targets = opts.targets.split(',');
  if (targets.includes('browser')) {
    buildBrowser(opts.mode);
  }

  if (targets.includes('server')) {
    buildServer(opts.mode);
  }
  if (targets.includes('config')) {
    buildConfig(opts.output);
  }
  if (targets.includes('package')) {
    buildPackage();
  }
}

export function buildBrowser(mode: Mode = 'production'): void {
  let cmd = `ng build --aot ${
    mode === 'production' ? '--configuration=production' : ''
  }`;

  console.log(`> build browser: ${cmd}`);
  execSync(cmd);
  write(`${destination}/core/browser/info.json`, { mode, time });
}

export function buildServer(mode: Mode = 'production'): void {
  let cmd = `ng run ngx-cms:server:${
    mode === 'production' ? 'production' : ''
  } --bundle-dependencies`;

  console.log(`> build server: ${cmd}`);
  execSync(cmd);
  write(`${destination}/core/server/info.json`, { mode, time });
}

export function buildConfig(output?: string): void {
  console.log(`> build config`);

  ['browser', 'server'].forEach((target) => {
    mkdir([`${destination}/config/${target}`]);

    let files = readdirSync(`${projectPath}/config/${target}`),
      // user-specific files (i.e file!!.ext, file!!) overrides project files (i.e file.ext)
      userFiles = files.filter((el) => /!!(\..+)?$/.test(el));

    if (output === 'js') {
      execSync(`webpack -c config/webpack.config.ts`);

      // copy non-ts files only
      files = files.filter((el) => !el.endsWith('.ts'));
    }

    files
      .filter(
        (el) =>
          // get the corresponding project files to any existing user-specific files
          !userFiles.map((el) => el.replace('!!', '')).includes(el) &&
          lstatSync(`${projectPath}/config/${target}/${el}`).isFile()
        // exclude files used for building (i.e config files)
      )
      .concat(userFiles)
      .forEach((el) =>
        copyFileSync(
          `${projectPath}/config/${target}/${el}`,
          `${destination}/config/${target}/${basename(el).replace('!!', '')}`
        )
      );
  });
}

export function buildPackage(): void {
  console.log(`> build package`);
  // copy files for deployment: Dockerfile, package.json, root/package-lock.json
  // & adjust package.json/scripts{start,deploy}, remove properties used for build
}
