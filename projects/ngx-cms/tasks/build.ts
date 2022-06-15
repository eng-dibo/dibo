import dotEnv from 'dotenv';

import { execSync } from '@engineers/nodejs/process';
import { mkdir, read, write } from '@engineers/nodejs/fs-sync';
import {
  appendFileSync,
  copyFileSync,
  existsSync,
  lstatSync,
  readdirSync,
  writeFileSync,
} from 'node:fs';
import { basename, resolve } from 'node:path';
import { dist as distribution, projectPath, rootPath } from './index';
import webpack from 'webpack';
import webpackMerge from 'webpack-merge';
// todo: use ~server/webpack.config
import baseConfig from '~~webpack.config';
import externals from '@engineers/webpack/externals';
import { JSDOM } from 'jsdom';
import webPush from 'web-push';

let time = Date.now();

export type Mode = 'production' | 'development' | 'test';
export interface BuildOptions {
  targets?: string | Array<string>;
  mode?: Mode;
  project?: string;
  distribution?: string;
  projectPath?: string;
  rootPath?: string;
}

/**
 *
 * @param options
 */
export default function (options?: BuildOptions): void {
  try {
    let options_ = Object.assign(
      {
        targets:
          process.env.BUILD_TARGETS || 'browser,server,config,package,optimize',
        mode: process.env.NODE_ENV || 'production',
        project: 'ngx-cms',
        distribution,
        projectPath,
        rootPath,
      },
      options || {}
    );

    // set process.env.NODE_ENV for building tools such as webpack
    if (!process.env.NODE_ENV) {
      process.env.NODE_ENV = options_.mode;
    }

    let progress: Promise<any> = Promise.resolve();

    let targets = options_.targets.split(',');
    if (targets.includes('browser')) {
      buildBrowser(options_);
    }

    if (targets.includes('server')) {
      buildServer(options_);
    }
    if (targets.includes('config')) {
      buildConfig(options_);
    }
    if (targets.includes('package')) {
      buildPackage(options_);
    }

    if (targets.includes('optimize')) {
      optimize(options_);
    }
  } catch {
    console.log('>> failed');
    return;
  }
}

/**
 *
 * @param mode
 * @param distribution
 * @param options
 */
export function buildBrowser(options: any): void {
  let cmd = `ng build --aot ${
    options.mode === 'production' ? '--configuration=production' : ''
  }`;

  console.log(`> build browser: ${cmd}`);

  execSync(cmd);
  write(`${options.distribution}/browser/info.json`, {
    mode: options.mode,
    time,
  });
}

/**
 *
 * @param mode
 * @param project
 * @param distribution
 * @param options
 */
export function buildServer(options: any): void {
  let cmd = `ng run ${options.project}:server${
    options.mode === 'production' ? ':production' : ''
  } `;

  console.log(`> build server: ${cmd}`);

  execSync(cmd);
  write(`${options.distribution}/server/info.json`, {
    mode: options.mode,
    time,
  });
}

/**
 *
 * @param distribution
 * @param options
 */
export function buildConfig(options: any): void {
  console.log(`> build config`);

  for (let target of ['browser', 'server']) {
    mkdir([`${options.distribution}/config/${target}`]);

    for (let element of readdirSync(`${options.projectPath}/config/${target}`))
      copyFileSync(
        `${options.projectPath}/config/${target}/${element}`,
        `${options.distribution}/config/${target}/${basename(element).replace(
          '!!',
          ''
        )}`
      );

    // userFiles override original config files
    if (existsSync(`${options.projectPath}/config!!/${target}`)) {
      for (let element of readdirSync(
        `${options.projectPath}/config!!/${target}`
      ))
        copyFileSync(
          `${options.projectPath}/config!!/${target}/${element}`,
          `${options.distribution}/config/${target}/${basename(element).replace(
            '!!',
            ''
          )}`
        );
    }
  }

  // generating VAPID keys for push notifications (should be generated only once)
  let gcloudConfig = require(`${options.distribution}/config/server/gcloud`);
  let GCM = gcloudConfig.GCM,
    vapidPath = resolve(`${options.distribution}/config/server/vapid.json`);
  if (GCM && GCM.id && !existsSync(vapidPath)) {
    console.log('> generating VAPID keys');
    // set .env to be used by config/server/*.js (.env is created in buildConfig())
    dotEnv.config({ path: `${options.distribution}/config/server/.env` });
    let vapidKeys = webPush.generateVAPIDKeys();
    write(vapidPath, vapidKeys);
  }
}

/**
 *
 * @param distribution
 * @param options
 */
export function buildPackage(options: any): void {
  console.log(`> build package`);
  // copy files for deployment: Dockerfile, package.json, root/package-lock.json
  // & adjust package.json/scripts{start,deploy}, remove properties used for build
  let rootPackage = read(`${options.projectPath}/package.json`) as {
    [key: string]: any;
  };
  let graphicsPackage = read(
    `${options.rootPath}/packages/graphics/package.json`
  ) as {
    [key: string]: any;
  };
  let package_ = {
    name: rootPackage.name,
    version: rootPackage.version,
    main: './server/main.js',
    scripts: {
      // use regex with global flag to replace all occurrences
      // https://chaseadams.io/posts/replace-multiple-instances-of-pattern-in-javascript/
      start: rootPackage.scripts.serve.replace(/.\/dist\//g, './'),
      deploy:
        'node -r dotenv/config tasks/deploy dotenv_config_path=./config/server/.env',
    },
    private: true,
    // todo: add @engineers/* packages (or remove them from webpack.externals)
    dependencies: {
      ...rootPackage.dependencies,
      // sharp is not included in the project's package.json
      // and excluded from webpack bundle, so we need to add it to the production package
      sharp: graphicsPackage.dependencies.sharp,
    },
    devDependencies: {
      // run 'node -r dotenv/config'
      dotenv: rootPackage.devDependencies.dotenv,
      // to run 'ngcc'
      '@angular/compiler-cli':
        rootPackage.devDependencies['@angular/compiler-cli'],
    },
    homepage: rootPackage.homepage,
    funding: rootPackage.funding,
  };
  write(`${options.distribution}/package.json`, package_);

  // copy the required files to build the container image
  for (let file of [
    `${options.projectPath}/Dockerfile`,
    `${options.rootPath}/package-lock.json`,
  ])
    copyFileSync(file, `${options.distribution}/${basename(file)}`);
  // todo: compile ./deploy to $dist by webpack
  // change $projectPath/package.scripts.deploy to execute $dist/package.scripts.deploy

  webpack(
    webpackMerge(baseConfig, {
      entry: {
        deploy: resolve(__dirname, './deploy.ts'),
      },
      output: {
        path: `${options.distribution}/tasks`,
        libraryTarget: 'commonjs',
        clean: false,
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
            // related to tasks/deploy.ts
            'commonjs2 ../config/{{$1}}'
          );
        },
      ],
    })
  ).run((error, stats) => {
    if (!error) {
      // call the default function, i.e deploy()
      // todo: pass options from cli (see ./index.ts -> runTask())
      appendFileSync(
        `${options.distribution}/tasks/deploy.js`,
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
 *
 * @param distribution
 * @param options
 */
//todo: options.optimize = minify(default in prod),index,pwa
export function optimize(options: any) {
  console.log(`> build: optimizing`);

  // transform index.html (lazy-load resources, and move them after 'load' event)
  // DOMParser() is not available in nodejs, so we use `jsdom`
  let browserPath = `${options.distribution}/browser`,
    indexPath = `${browserPath}/index.html`,
    content = read(indexPath) as string;

  // create a backup
  write(indexPath.replace('index.html', 'index-backup.html'), content);

  let dom = new JSDOM(content).window.document,
    txt = '';

  write(`${browserPath}/styles.css`, '');
  write(`${browserPath}/scripts.js`, '');

  /**
   *
   * @param element
   */
  function getAttributes(element: any): { [key: string]: string } {
    let result: { [key: string]: string } = {};
    if (element.hasAttributes()) {
      for (let index = 0; index < element.attributes.length; index++) {
        result[element.attributes[index].name] =
          element.attributes[index].value;
      }
    }
    return result;
  }

  dom.querySelectorAll('script').forEach((script: any) => {
    // todo: ||data-keep
    if (!script.src) {
      appendFileSync(`${browserPath}/styles.css`, script.innerHTML);
      script.remove();
    } else {
      // todo: converting <script type="module"> to load() causes a blank page displayed.
      // even if they loaded.
      let type = script.getAttribute('type');
      if (type === 'module') {
        return;
      }

      // nomodule prevents the modern browsers to load the script,
      // it instead, will load the "module" version
      // https://stackoverflow.com/a/45947601/12577650

      txt += `load("${script.src}",{${
        type === 'module' ? '' : 'nomodule:true,defer:true'
      }},"${type || 'script'}");\n`;

      script.remove();
    }
  });

  dom.querySelectorAll('link').forEach((element: any) => {
    if (
      element.parentElement.tagName.toLowerCase() !== 'noscript' &&
      element.rel === 'stylesheet'
    ) {
      txt += `load("${element.href}",${JSON.stringify(
        getAttributes(element)
      )},"css");`;
      element.remove();
    }
  });

  dom.querySelectorAll('style').forEach((element: any) => {
    // combine all styles into a single file, and load it via load()
    appendFileSync(`${browserPath}/styles.css`, element.innerHTML);
    element.remove();
  });

  txt += `load("styles.css");\n load("scripts.js")`;
  txt = `window.addEventListener("load", () => {
    import("./load.mjs")
    .then((module) => module.default)
    .then((load)=>{${txt}})});`;
  let script = dom.createElement('script');
  script.setAttribute('type', 'module');
  script.append(txt);
  // todo: dom.body.append(script); causes error after deploying to cloud
  // window load event not firing
  dom.head.append(script);

  // todo: minify index.html
  write(indexPath, '<!DOCTYPE html>\n' + dom.documentElement.outerHTML);

  //  minify js files using terser
  for (let dir of ['browser', 'server'])
    for (let element of readdirSync(`${options.distribution}/${dir}`).filter(
      (element_) => element_.endsWith('.js')
    )) {
      let path = `${options.distribution}/${dir}/${element}`;
      console.log(`> minifying: ${dir}/${element}`);
      execSync(
        `terser ${path} --output ${path} --compress --mangle --keep-fnames`
      );
    }

  // the hashes for modified files is changed, so we need to rebuild ngsw-config with the new hashes
  // install @angular/service-worker to use ngsw-config (or use npx ngsw-config)
  // paths are relative to CWD
  // todo: using the absolute (`${dist}/browser`) path causes error
  execSync(`ngsw-config ./dist/browser browser/ngsw-config.json`);
}
