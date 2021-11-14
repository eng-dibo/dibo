import { execSync } from '@engineers/nodejs/process';
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
}

export default function (options?: BuildOptions): void {
  let opts = Object.assign(
    {
      targets: 'browser,server,config,package',
      mode: process.env.NODE_ENV || 'production',
    },
    options || {}
  );

  let targets = opts.targets.split(',');
  if (targets.includes('browser')) {
    buildBrowser(opts.mode);
  }
  if (targets.includes('server')) {
    buildServer(opts.mode);
  }
  if (targets.includes('config')) {
    buildConfig();
  }
  if (targets.includes('package')) {
    buildPackage();
  }
}

export function buildBrowser(mode: Mode = 'production'): void {
  execSync(
    `ng build --aot ${
      mode === 'production' ? '--configuration=production' : ''
    }`
  );

  write(`${destination}/core/browser/info.json`, { mode, time });
}

export function buildServer(mode: Mode = 'production'): void {
  execSync(
    `ng run ngx-cms:server:${
      mode === 'production' ? 'production' : ''
    } --bundle-dependencies`
  );

  write(`${destination}/core/server/info.json`, { mode, time });
}

export function buildConfig(): void {
  // now the source code(.ts) cold used in config using `ts-node` instead of `webpack`
  // no need to compile it
  // i.e read config/*.ts using ts-node for more readability
  // webpack produces non-human readable output
  // execSync(`webpack -c config/webpack.config.ts`);

  ['browser', 'server'].forEach((target) => {
    mkdir([`${destination}/config/${target}`]);

    let files = readdirSync(`${projectPath}/config/${target}`);
    // user-specific files (i.e file!!.ext, file!!) overrides project files (i.e file.ext)
    let userFiles = files.filter((el) => /!!(\..+)?$/.test(el));

    files
      .filter(
        (el) =>
          // get the corresponding project files to any existing user-specific files
          !userFiles.map((el) => el.replace('!!', '')).includes(el) &&
          lstatSync(`${projectPath}/config/${target}/${el}`).isFile()
        // exclude files used for building
      )
      .forEach((el) =>
        copyFileSync(
          `${projectPath}/config/${target}/${el}`,
          `${destination}/config/${target}/${basename(el).replace('!!', '')}`
        )
      );
  });
}

export function buildPackage(): void {
  // copy files for deployment: Dockerfile, package.json, root/package-lock.json
  // & adjust package.json/scripts{start,deploy}, remove properties used for build
}
