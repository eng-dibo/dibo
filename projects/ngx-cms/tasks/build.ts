import dotEnv from 'dotenv';

import { execSync } from '@engineers/nodejs/process';
import { mkdir, write, read } from '@engineers/nodejs/fs-sync';
import {
  readdirSync,
  lstatSync,
  existsSync,
  copyFileSync,
  appendFileSync,
} from 'node:fs';
import { basename, resolve } from 'node:path';
import { rootPath, projectPath, destination } from './index';
import webpack from 'webpack';
import webpackMerge from 'webpack-merge';
import baseConfig from '~~webpack.config';
import externals from '@engineers/webpack/externals';
import { JSDOM } from 'jsdom';
import webPush from 'web-push';

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
        targets:
          process.env.BUILD_TARGETS || 'browser,server,config,package,optimize',
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

    if (targets.includes('optimize')) {
      optimize();
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

  // generating VAPID keys for push notifications (should be generated only once)
  let gcloudConfig = require(`${destination}/config/server/gcloud`);
  let GCM = gcloudConfig.GCM,
    vapidPath = resolve(`${destination}/config/server/vapid.json`);
  if (GCM && GCM.id && !existsSync(vapidPath)) {
    console.log('> generating VAPID keys');
    // set .env to be used by config/server/*.js (.env is created in buildConfig())
    dotEnv.config({ path: `${destination}/config/server/.env` });
    let vapidKeys = webPush.generateVAPIDKeys();
    write(vapidPath, vapidKeys);
  }
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

/**
 * optimize the bundle for production mode
 *  - minify js files
 *  - transform index.html
 *  - rebuild ngsw-config with the new hashes
 */
//todo: options.optimize = minify(default in prod),index,pwa
export function optimize() {
  console.log(`> build: optimizing`);

  // minify js files using terser

  /*['browser', 'server'].forEach((dir) =>
    readdirSync(`${destination}/core/${dir}`)
      // todo:
      .filter((el) => el.endsWith('.js'))
      .forEach((el) => {
        let path = `${destination}/core/${dir}/${el}`;
        console.log(`> minifying: ${dir}/${el}`);
        execSync(
          `terser ${path} --output ${path} --compress --mangle --keep-fnames`
        );
      })
  );*/

  // transform index.html (lazy-load resources, and move them after 'load' event)
  // DOMParser() is not available in nodejs, so we use `jsdom`
  let indexPath = `${destination}/core/browser/index.html`;
  let content = read(indexPath) as string;

  // create a backup
  write(indexPath.replace('index.html', 'index-backup.html'), content);

  let dom = new JSDOM(content).window.document,
    txt = '';

  function getAttributes(el: any): { [key: string]: string } {
    let result: { [key: string]: string } = {};
    if (el.hasAttributes()) {
      for (let i = 0; i < el.attributes.length; i++) {
        result[el.attributes[i].name] = el.attributes[i].value;
      }
    }
    return result;
  }

  dom.querySelectorAll('script').forEach((script: any) => {
    // todo: ||data-keep
    if (!script.src) {
      return;
    }

    // todo: converting <script type="module"> to load() causes a blank page displayed.
    // even if they loaded.
    let type = script.getAttribute('type');
    if (type === 'module') {
      return;
    }

    // nomodule prevents the modern browsers to load the script,
    // it instead, will load the "module" version
    // https://stackoverflow.com/a/45947601/12577650

    txt += `load("${script.src}","${type || 'script'}",{${
      type === 'module' ? '' : 'nomodule:true,defer:true'
    }});\n`;

    script.remove();
  });

  dom.querySelectorAll('link').forEach((el: any) => {
    if (
      el.parentElement.tagName.toLowerCase() !== 'noscript' &&
      el.rel === 'stylesheet'
    ) {
      txt += `load("${el.href}",${JSON.stringify(getAttributes(el))},"css");`;
      el.remove();
    }
  });

  txt = `import load from "./load.mjs";\nwindow.addEventListener("load", () => {\n${txt}\n});`;
  let script = dom.createElement('script');
  script.setAttribute('type', 'module');
  script.append(txt);
  // todo: dom.body.append(script); causes error after deploying to cloud
  // window load event not firing
  dom.head.append(script);

  // todo: minify index.html
  write(indexPath, '<!DOCTYPE html>\n' + dom.documentElement.outerHTML);

  // the hashes for modified files is changed, so we need to rebuild ngsw-config with the new hashes
  // install @angular/service-worker to use ngsw-config (or use npx ngsw-config)
  // todo: using the absolute (`${destination}/core/browser`) path causes error
  execSync(
    `ngsw-config ../../dist/ngx-cms/core/browser browser/ngsw-config.json`
  );
}
