import { execPromise, execSync } from '@engineers/nodejs/process';
import { mkdir, write, read } from '@engineers/nodejs/fs-sync';
import {
  readdirSync,
  lstatSync,
  existsSync,
  copyFileSync,
  writeFileSync,
  appendFileSync,
} from 'fs';
import { basename, resolve } from 'path';
import { rootPath, projectPath, destination } from './index';
import webpack from 'webpack';
import webpackMerge from 'webpack-merge';
import baseConfig from '~~webpack.config';
import externals from '@engineers/webpack/externals';

let time = Date.now();

export type Mode = 'production' | 'development' | 'test';
export interface BuildOptions {
  targets?: string | Array<string>;
  mode?: Mode;
}

export default function (options?: BuildOptions): void {
  try {
    let opts = Object.assign(
      {
        targets: process.env.BUILD_TARGETS || 'browser,server,config,package',
        mode: process.env.NODE_ENV || 'production',
      },
      options || {}
    );

    // set process.env.NODE_ENV for building tools such as webpack
    if (!process.env.NODE_ENV) {
      process.env.NODE_ENV = opts.mode;
    }

    let progress: Promise<any> = Promise.resolve();

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
  } catch (err) {
    console.log('>> faild');
    return;
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
  let cmd = `ng run ngx-cms:server${
    mode === 'production' ? ':production' : ''
  } `;

  console.log(`> build server: ${cmd}`);

  execSync(cmd);
  write(`${destination}/core/server/info.json`, { mode, time });
}

export function buildConfig(): void {
  console.log(`> build config`);

  ['browser', 'server'].forEach((target) => {
    mkdir([`${destination}/config/${target}`]);

    let files = readdirSync(`${projectPath}/config/${target}`),
      // user-specific files (i.e file!!.ext, file!!) overrides project files (i.e file.ext)
      userFiles = files.filter((el) => /!!(\..+)?$/.test(el));

    files
      .filter(
        (el) =>
          // get the corresponding project files to any existing user-specific files
          !userFiles.map((el) => el.replace('!!', '')).includes(el) &&
          lstatSync(`${projectPath}/config/${target}/${el}`).isFile()
        // todo: exclude files used for building (i.e config files)
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
  let rootPkg = read(`${projectPath}/package.json`) as { [key: string]: any };
  let graphicsPkg = read(`${rootPath}/packages/graphics/package.json`) as {
    [key: string]: any;
  };
  let pkg = {
    name: rootPkg.name,
    version: rootPkg.version,
    main: './core/server/main.js',
    scripts: {
      // use regex with global flag to replace all occurrences
      // https://chaseadams.io/posts/replace-multiple-instances-of-pattern-in-javascript/
      start: rootPkg.scripts.serve.replace(/..\/..\/dist\/ngx-cms\//g, './'),
      deploy: 'node deploy',
      postinstall: 'ngcc',
    },
    private: true,
    // todo: add @engineers/* packages (or remove them from webpack.externals)
    dependencies: {
      ...rootPkg.dependencies,
      // sharp is not included in the project's package.json
      // and excluded from webpack bundle, so we need to add it to the production package
      sharp: graphicsPkg.dependencies.sharp,
    },
    devDependencies: {
      // run 'node -r dotenv/config'
      dotenv: rootPkg.devDependencies.dotenv,
      // to run 'ngcc'
      '@angular/compiler-cli': rootPkg.devDependencies['@angular/compiler-cli'],
    },
    homepage: rootPkg.homepage,
    funding: rootPkg.funding,
  };
  write(`${destination}/package.json`, pkg);

  // copy the required files to build the container image
  [`${projectPath}/Dockerfile`, `${rootPath}/package-lock.json`].forEach(
    (file) => copyFileSync(file, `${destination}/${basename(file)}`)
  );
  // todo: compile ./deploy to $dist by webpack
  // change $projectPath/package.scripts.deploy to execute $destination/package.scripts.deploy

  webpack(
    webpackMerge(baseConfig, {
      entry: {
        deploy: resolve(__dirname, './deploy.ts'),
      },
      output: {
        path: destination,
        libraryTarget: 'commonjs',
      },
      resolve: {
        alias: {
          '~': resolve(__dirname, '.'),
        },
      },
      externals: [
        function () {
          externals(
            arguments,
            [/^~{1,2}config\/(.*)/],
            'commonjs2 ./config/{{$1}}'
          );
        },
      ],
    })
  ).run((err, stats) => {
    if (!err) {
      // call the default function, i.e deploy()
      // todo: pass options from cli (see ./index.ts -> runTask())
      appendFileSync(
        `${destination}/deploy.js`,
        '\n\nmodule.exports.default();'
      );
    }
  });
}
