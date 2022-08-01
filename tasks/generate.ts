/* eslint-disable sort-keys */
import { getEntries, read, write } from '@engineers/nodejs/fs';
import { read as readSync } from '@engineers/nodejs/fs-sync';
import { Obj, filterObjectByKeys } from '@engineers/javascript/objects';
import { basename, dirname, resolve } from 'node:path';
import { existsSync, writeFileSync } from 'node:fs';
import ejs from 'ejs';
import linkLocalDependencies from './link-local-dependencies';

let rootPath = resolve(__dirname, '..'),
  rootPackage = readSync(`${rootPath}/package.json`),
  // todo: copy `author` to other package.json files only if not existing.
  keys = ['repository', 'homepage', 'bugs', 'license', 'author', 'funding'],
  rootData = filterObjectByKeys(rootPackage as Obj, keys),
  defaultPackage = (directory: string) => ({
    name: `@engineers/${basename(directory)}`,
    version: '0.0.1',
    // projects shouldn't be published to npm
    private: directory.startsWith('projects/'),
    // include only `tsconfig.compilerOptions.outDir` folder when publishing to npm
    // in addition to package.json and README.md
    files: ['dist'],
  }),
  defaultScripts = {
    build: 'webpack',
    postbuild: 'shx cp package.json dist',
    _publish: 'npm publish --access=public',
    // build the package just before it is about to be published and released
    // no need to build all packages before running `npm run release`
    prepublishOnly: 'npm run build',
    // a temporary workaround to avoid the error $pkgDir/package.json is missing
    // by @semantic-release/npm
    prerelease: 'shx mkdir -p dist && shx cp package.json dist',
    'prerelease:local': 'npm run prerelease',
    release: 'semantic-release',
    'release:local': 'semantic-release --no-ci',
    // after semantic-release change the version in dist/package.json
    // copy dist/package.json to the package's root
    postversion: 'shx cp package.json ..',
    // clean the build folder after the releasing finished
    // -r: recursive, -f: force
    // todo: using separate arguments (i.e -f -r) fails with 'shx'
    postrelease: 'shx rm -fr dist && shx rm -fr tarball!!',
    'postrelease:local': 'npm run postrelease',
  };

export interface GenerateOptions {
  // the entry name including the target, i.e $target/$name
  // $target is projects|packages|ng(Angular library)
  // multiple names may be provided, as an array or comma-separated string
  // if an entry already exists it will be updated
  name?: string;
  // override the existing package.scripts with default scripts (for updatePackages())
  overrideScripts?: boolean;
  // other properties of package.json
  [key: string]: any;
}

/**
 * generates the build files such as package.json, README.md, ...
 *
 * @param entries
 * @param options package properties
 */
export default async function generate(
  // todo: accept regex or glob patterns, example: projects/*
  entries?: string | string[],
  options: GenerateOptions = {}
): Promise<(void | void[])[]> {
  // todo: fix cli parsing,
  // if no argument passed to the command, then arguments=[{}]
  if (arguments.length < 2) {
    options = arguments[0];
    entries = undefined;
  }

  let { overrideScripts, ...packageObject } = options;

  if (typeof entries === 'string') {
    entries = entries.split(',');
  }

  if (!entries) {
    entries = await getDirs();
    // set entry format to $target/name instead of full path
    entries = entries.map((el) => `${basename(dirname(el))}/${basename(el)}`);
  }

  if (entries) {
    // validate entries, it must be in form of `$target/$name`, where $target = projects | packages
    let invalidEntry = entries.find(
      (el) => !/^projects|packages|ng\/[^/]+$/.test(el)
    );
    if (invalidEntry) {
      throw new Error(
        `invalid entry ${invalidEntry}, entry must be in form of $target/$name where target is projects or packages`
      );
    }

    entries = entries.map((el) => el.trim());
  }

  return updatePackages(entries, packageObject, overrideScripts).then(() =>
    Promise.all([
      updateReadMe(entries as string[]),
      addTsconfig(entries as string[]),
      addWebpackConfig(entries as string[]),
      // addJestConfig(entries as string[]),
      addSemanticReleaseConfig(entries as string[]),
      // todo: create an empty index.ts in each entry dir
      linkLocalDependencies(),
    ])
  );
}

/**
 * generates package.json files.
 * add fixed properties from package.json in the root dir
 * to other package.json files in all subdirectories.
 *
 * paths are relative to cwd()
 *
 * @param directories packages where to update it's readme.md file
 * @param packageObject additional package properties provided by cli, takes precedence over the existing properties
 * @param entries
 * @param overrideScripts override the existing scripts
 * @returns Promise<void>
 */
export function updatePackages(
  entries?: string[] | Promise<string[]>,
  packageObject: { [key: string]: any } = {},
  overrideScripts = false
): Promise<void> {
  return Promise.resolve(entries || getDirs())
    .then((entries: Array<string>) =>
      Promise.all(
        entries.map((entry: string) => {
          let isAngularLibrary = false;
          if (entry.startsWith('ng/')) {
            isAngularLibrary = true;
            entry = entry.replace('ng/', 'packages/');
          }
          let packagePath = resolve(rootPath, `${entry}/package.json`);

          return (
            read(packagePath)
              // if file not exists create a new one
              .catch(() => ({}))
              .then((content) => {
                // todo: make deep merging to merge properties like `scripts`
                let pkg = Object.assign(
                  // the default package's properties
                  defaultPackage(entry),
                  // properties from root package.json
                  rootData,
                  // the existing package properties
                  content,
                  // user provided properties
                  packageObject
                );

                pkg.scripts = overrideScripts
                  ? // in force mode, default scripts overrides existing scripts
                    Object.assign({}, pkg.scripts || {}, defaultScripts)
                  : Object.assign({}, defaultScripts, pkg.scripts || {});

                return pkg;
              })
              // file will be linted on commit
              .then((content) => write(packagePath, content))
          );
        })
      )
    )

    .then();
}

/**
 * update readMe.md file in each package
 *
 * @param dirs see updatePackages()
 * @param directories
 */
export function updateReadMe(directories?: string[]): Promise<void> {
  return getDirs()
    .then((entries: Array<string>) =>
      Promise.all(
        (directories || entries).map((entry: string) => {
          read(`${entry}/package.json`)
            // if ${entry}/package.json not exists, use rootData
            .catch((error) => {
              let pkg = Object.assign(rootData, defaultPackage(entry));
              pkg.scripts = Object.assign(defaultScripts, pkg.scripts || {});
              return pkg;
            })
            .then((pkg) => {
              pkg = pkg as Obj;

              let details;
              if (existsSync(`${entry}/README.tmpl.md`)) {
                // todo: pass pkg=read(entry/package.json) to `README.tmpl.md`
                details = readSync(`${entry}/README.tmpl.md`);
              }

              // todo: use `{{ .. }}` instead of `<% .. %>
              // https://stackoverflow.com/questions/33973388/ejs-2-custom-delimiter/33974027
              let content = ejs.renderFile('./tasks/README.tmpl.md', {
                details,
                pkg,
                // format: $target/$name instead of full path
                // compatible with different OS
                entries: entries
                  // filter only entries that has package.json
                  .filter((el) => existsSync(`${el}/package.json`))
                  .map((el) => `${basename(dirname(el))}/${basename(el)}`),
              });

              return content;
            })
            .then((content) => write(`${entry}/README.md`, content));
        })
      )
    )
    .then();
}

/**
 *
 * @param directories
 */
export function addTsconfig(
  directories?: string[] | Promise<string[]>
): Promise<void[]> {
  let content = JSON.stringify({
    extends: '../../tsconfig.json',
    compilerOptions: {
      baseUrl: '.',
      outDir: './dist',
      allowJs: false,
      paths: { '~~*': ['../../*'], '@engineers/*': ['../../packages/*'] },
    },
  });

  return Promise.resolve(directories || getDirs()).then((directories) =>
    directories
      .filter((directory) => !existsSync(`${directory}/tsconfig.json`))
      .map((directory) => writeFileSync(`${directory}/tsconfig.json`, content))
  );
}

/**
 *
 * @param directories
 */
export function addWebpackConfig(
  directories?: string[] | Promise<string[]>
): Promise<void[]> {
  let content = `
  import webpackMerge from 'webpack-merge';
  import { Configuration } from 'webpack';
  import baseConfig from '~~webpack.config';
  import { resolve } from 'node:path';
  import { getEntries, read } from '@engineers/nodejs/fs-sync';
  
  let tsConfig = read(resolve(__dirname, 'tsconfig.json')) as {[key:string]: any};
  let entry:{[key:string]:string} = {};
  // convert path to posix, i.e using "/" in all platforms
  let pattern = new RegExp(\`\${__dirname.replace(/\\\\/g, '/')}/(.+).ts$\`);
  getEntries(__dirname, /(?<!\.config|\.spec)\.ts$/).forEach((file) => {
    entry[file.replace(/\\\\/g, '/').match(pattern)![1]] = file;
  });
  
  export default webpackMerge(baseConfig, {
    entry,
    output: {
      path: resolve(__dirname, tsConfig.compilerOptions.outDir),
    },
  });
`;

  return Promise.resolve(directories || getDirs()).then((directories) =>
    directories
      .filter((directory) => !existsSync(`${directory}/webpack.config.ts`))
      .map((directory) =>
        writeFileSync(`${directory}/webpack.config.ts`, content)
      )
  );
}

/**
 *
 * @param directories
 */
export function addJestConfig(
  directories?: string[] | Promise<string[]>
): Promise<void[]> {
  let content = `
   import jestConfig from '../../jest.config';
   export default Object.assign({}, jestConfig, {
    testMatch: [\`\${__dirname}/**/*.spec.ts\`],
   });
`;

  return Promise.resolve(directories || getDirs()).then((directories) =>
    directories
      .filter((directory) => !existsSync(`${directory}/jest.config.ts`))
      .map((directory) => writeFileSync(`${directory}/jest.config.ts`, content))
  );
}

/**
 *
 * @param directories
 */
export function addSemanticReleaseConfig(
  directories?: string[] | Promise<string[]>
): Promise<void[]> {
  return Promise.resolve(directories || getDirs()).then((directories) =>
    directories
      .filter((directory) => !existsSync(`${directory}/release.config.js`))
      .map((directory) => {
        let file = `release.${
          directory.startsWith('projects/') ? 'app' : 'package'
        }.config.js`;

        let content = `
          let baseConfig= require("../../${file}");
          module.exports = baseConfig;
        `;
        writeFileSync(`${directory}/release.config.js`, content);
      })
  );
}

/**
 * get a list of packages and/or projects
 *
 * @param targets
 */
// eslint-disable-next-line unicorn/prevent-abbreviations
export function getDirs(
  targets: string[] = ['./packages', './projects']
): Promise<Array<string>> {
  return Promise.all(
    targets.map((directory) => getEntries(directory, 'dirs', 0))
  ).then(
    // combine an array of arrays into a single array
    (results) => results.flat()
  );
}
