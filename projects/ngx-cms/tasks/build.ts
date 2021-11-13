import { execSync } from '@engineers/nodejs/process';
import { mkdir } from '@engineers/nodejs/fs-sync';
import { readdirSync, lstatSync, existsSync, copyFileSync } from 'fs';
import { basename } from 'path';
import { rootPath, projectPath, destination } from './index';

export type Mode = 'production' | 'development' | 'test';
export interface BuildOptions {
  targets?: string | Array<string>;
  mode?: Mode;
}

export default function (options?: BuildOptions): void {
  let opts = Object.assign(
    {
      targets: 'browser,server,config,deploy',
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
  if (targets.includes('deploy')) {
    buildDeploy();
  }
}

export function buildBrowser(mode: Mode = 'production'): void {
  execSync(
    `ng build --aot ${
      mode === 'production' ? '--configuration=production' : ''
    }`
  );
}

export function buildServer(mode: Mode = 'production'): void {
  execSync(
    `ng run ngx-cms:server:${
      mode === 'production' ? 'production' : ''
    } --bundle-dependencies`
  );
}

export function buildConfig(): void {
  execSync(`webpack -c config/webpack.config.ts`);

  // copy non-ts files
  mkdir(`${destination}/config`);
  let files = readdirSync(`${projectPath}/config`);
  // user-specific files (i.e file!!.ext, file!!) overrides project files (i.e file.ext)
  let userFiles = files.filter((el) => /!!(\..+)?$/.test(el));
  userFiles.forEach((el) =>
    copyFileSync(
      `${projectPath}/config/${el}`,
      `${destination}/config/${basename(el)}`
    )
  );

  files
    .filter(
      (el) =>
        !el.endsWith('.ts') &&
        // get the corresponding project files to any existing user-specific files
        !userFiles.map((el) => el.replace('!!', '')).includes(el) &&
        lstatSync(`${projectPath}/config/${el}`).isFile() &&
        // exclude files used for building
        !['tsconfig.json'].includes(el)
    )
    .forEach((el) =>
      copyFileSync(
        `${projectPath}/config/${el}`,
        `${destination}/config/${basename(el).replace('!!', '')}`
      )
    );
}

export function buildDeploy(): void {
  // copy files for deployment: Dockerfile, package.json, root/package-lock.json
  // & adjust package.json
}
