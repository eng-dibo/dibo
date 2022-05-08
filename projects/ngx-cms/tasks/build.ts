import dotEnv from 'dotenv';

import { execSync } from '@engineers/nodejs/process';
import { mkdir, write, read } from '@engineers/nodejs/fs-sync';
import {
  readdirSync,
  lstatSync,
  existsSync,
  copyFileSync,
  writeFileSync,
  appendFileSync,
} from 'node:fs';
import { basename, resolve } from 'node:path';
import { rootPath, projectPath, dist } from './index';
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
    console.log('>> failed');
    return;
  }
}

export function buildBrowser(mode: Mode = 'production'): void {
  // use --stats-json to create dist/browser/stats.json
  // use webpack-bundle-analyzer (npm run analyze) to create a visual version of this stats
  // to know which modules increase your bundle size
  // open localhost::8888
  // https://www.digitalocean.com/community/tutorials/angular-angular-webpack-bundle-analyzer
  let cmd = `ng build --aot --stats-json ${
    mode === 'production' ? '--configuration=production' : ''
  }`;

  console.log(`> build browser: ${cmd}`);

  execSync(cmd);
  write(`${dist}/browser/info.json`, { mode, time });
}

export function buildServer(mode: Mode = 'production'): void {
  let cmd = `ng run ngx-cms:server${
    mode === 'production' ? ':production' : ''
  } `;

  console.log(`> build server: ${cmd}`);

  execSync(cmd);
  write(`${dist}/server/info.json`, { mode, time });
}

export function buildConfig(): void {
  console.log(`> build config`);

  ['browser', 'server'].forEach((target) => {
    mkdir([`${dist}/config/${target}`]);

    readdirSync(`${projectPath}/config/${target}`).forEach((el) =>
      copyFileSync(
        `${projectPath}/config/${target}/${el}`,
        `${dist}/config/${target}/${basename(el).replace('!!', '')}`
      )
    );

    // userFiles override original config files
    if (existsSync(`${projectPath}/config!!/${target}`)) {
      readdirSync(`${projectPath}/config!!/${target}`).forEach((el) =>
        copyFileSync(
          `${projectPath}/config!!/${target}/${el}`,
          `${dist}/config/${target}/${basename(el).replace('!!', '')}`
        )
      );
    }
  });

  // generating VAPID keys for push notifications (should be generated only once)
  let gcloudConfig = require(`${dist}/config/server/gcloud`);
  let GCM = gcloudConfig.GCM,
    vapidPath = resolve(`${dist}/config/server/vapid.json`);
  if (GCM && GCM.id && !existsSync(vapidPath)) {
    console.log('> generating VAPID keys');
    // set .env to be used by config/server/*.js (.env is created in buildConfig())
    dotEnv.config({ path: `${dist}/config/server/.env` });
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
    main: './server/main.js',
    scripts: {
      // use regex with global flag to replace all occurrences
      // https://chaseadams.io/posts/replace-multiple-instances-of-pattern-in-javascript/
      start: rootPkg.scripts.serve.replace(/.\/dist\//g, './'),
      deploy:
        'node -r dotenv/config tasks/deploy dotenv_config_path=./config/server/.env',
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
  write(`${dist}/package.json`, pkg);

  // copy the required files to build the container image
  [`${projectPath}/Dockerfile`, `${rootPath}/package-lock.json`].forEach(
    (file) => copyFileSync(file, `${dist}/${basename(file)}`)
  );
  // todo: compile ./deploy to $dist by webpack
  // change $projectPath/package.scripts.deploy to execute $dist/package.scripts.deploy

  webpack(
    webpackMerge(baseConfig, {
      entry: {
        deploy: resolve(__dirname, './deploy.ts'),
      },
      output: {
        path: `${dist}/tasks`,
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
  ).run((err, stats) => {
    if (!err) {
      // call the default function, i.e deploy()
      // todo: pass options from cli (see ./index.ts -> runTask())
      appendFileSync(
        `${dist}/tasks/deploy.js`,
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

  // todo: minify js files using terser

  ['browser', 'server'].forEach((dir) =>
    readdirSync(`${dist}/${dir}`)
      .filter((el) => el.endsWith('.js'))
      .forEach((el) => {
        let path = `${dist}/${dir}/${el}`;
        console.log(`> minifying: ${dir}/${el}`);
        execSync(
          `terser ${path} --output ${path} --compress --mangle --keep-fnames`
        );
      })
  );

  // transform index.html (lazy-load resources, and move them after 'load' event)
  // DOMParser() is not available in nodejs, so we use `jsdom`
  let browserPath = `${dist}/browser`,
    indexPath = `${browserPath}/index.html`,
    content = read(indexPath) as string;

  // create a backup
  write(indexPath.replace('index.html', 'index-backup.html'), content);

  let dom = new JSDOM(content).window.document,
    txt = '';

  write(`${browserPath}/styles.css`, '');
  write(`${browserPath}/scripts.js`, '');
  write(`${browserPath}/modules.mjs`, '');

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
      appendFileSync(`${browserPath}/scripts.js`, script.innerHTML);
      script.remove();
    } else {
      // todo: converting <script type="module"> to load() causes a blank page displayed.
      // even if they loaded.
      let type = script.getAttribute('type');
      if (type === 'module') {
        if (!['scripts.mjs', 'modules.mjs'].includes(script.src)) {
          // todo: load modules after dom.loaded event
          appendFileSync(
            `${browserPath}/modules.mjs`,
            `await import("./${script.src}").then(module=>console.log(module));\n`
          );
          script.remove();
        }

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

  dom.querySelectorAll('link').forEach((el: any) => {
    if (
      el.parentElement.tagName.toLowerCase() !== 'noscript' &&
      el.rel === 'stylesheet'
    ) {
      txt += `load("${el.href}",${JSON.stringify(getAttributes(el))},"css");`;
      el.remove();
    }
  });

  dom.querySelectorAll('style').forEach((el: any) => {
    // combine all styles into a single file, and load it via load()
    appendFileSync(`${browserPath}/styles.css`, el.innerHTML);
    el.remove();
  });

  txt += `load("styles.css"); load("scripts.js")`;
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
  // paths are relative to CWD
  // todo: using the absolute (`${dist}/browser`) path causes error
  execSync(`ngsw-config ./dist/browser browser/ngsw-config.json`);
}
