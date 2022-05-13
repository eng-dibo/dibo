import { getEntries, read, write } from '@engineers/nodejs/fs';
import { read as readSync } from '@engineers/nodejs/fs-sync';
import { filterObjectByKeys, Obj } from '@engineers/javascript/objects';
import { basename, dirname, resolve } from 'node:path';
import { existsSync, writeFileSync } from 'node:fs';
import ejs from 'ejs';

let rootPath = resolve(__dirname, '..'),
  rootPackage = readSync(`${rootPath}/package.json`),
  // todo: copy `author` to other package.json files only if not existing.
  keys = ['repository', 'homepage', 'bugs', 'license', 'author', 'funding'],
  rootData = filterObjectByKeys(rootPackage as Obj, keys),
  defaultPackage = (dir: string) => ({
    name: `@engineers/${basename(dir)}`,
    version: '0.0.1',
    // projects shouldn't be published to npm
    private: dir.startsWith('projects/'),
    // include only `tsconfig.compilerOptions.outDir` folder when publishing to npm
    // in addition to package.json and README.md
    files: ['dist'],
  }),
  defaultScripts = {
    build: 'webpack',
    postbuild: 'shx cp package.json dist',
    _publish: 'npm run build && npm publish --access=public',
    // build the package just before it is about to be published and released
    // no need to build all packages before running `npm run release`
    prepublishOnly: 'npm run build',
    // a temporary workaround to avoid the error $pkgDir/package.json is missing
    // by @semantic-release/npm
    prerelease: 'shx mkdir -p dist && shx cp package.json dist',
    'prerelease:local': 'npm run prerelease',
    release: 'semantic-release',
    'release:local': 'semantic-release --no-ci',
    postversion: 'shx cp package.json ..',
  };

export interface GenerateOptions {
  // if name provided, create a new package, or update a specific package
  // else update all packages
  name?: string;
  target?: 'packages' | 'projects';
  // other properties of package.json
  [key: string]: any;
}

/**
 * generates build files such as package.json, README.md, etc.
 */
export default function generate(
  name: string,
  options: GenerateOptions = {}
): Promise<(void | void[])[]> {
  if (arguments.length === 2) {
    let { target = 'packages', ...pkg } = options;
    let path = `${rootPath}/${target}/${name}`;
    return updatePackages([path], pkg).then(() =>
      Promise.all([
        updateReadMe([path]),
        addTsconfig([path]),
        addWebpackConfig([path]),
        addSemanticReleaseConfig([path]),
        write(`${path}/index.ts`, ''),
      ])
    );
  } else {
    return updatePackages().then(() =>
      Promise.all([
        updateReadMe(),
        addTsconfig(),
        addWebpackConfig(),
        addSemanticReleaseConfig(),
      ])
    );
  }
}

/**
 * generates package.json files.
 * add fixed properties from package.json in the root dir
 * to other package.json files in all subdirectories.
 *
 * paths are relative to cwd()
 * @param dirs packages where to update it's readme.md file
 * @param pkgObj additional package properties provided by cli, takes precedence over the existing properties
 */
export function updatePackages(
  dirs?: string[] | Promise<string[]>,
  pkgObj: { [key: string]: any } = {}
): Promise<void> {
  return Promise.resolve(dirs || getDirs())
    .then((entries: Array<string>) =>
      Promise.all(
        entries.map((entry: string) => {
          return (
            read(`${entry}/package.json`)
              // if file not exists create a new one
              .catch(() => ({}))
              .then((content) => {
                let pkg = Object.assign(
                  defaultPackage(entry),
                  rootData,
                  content,
                  pkgObj
                );

                pkg.scripts = Object.assign(
                  {},
                  defaultScripts,
                  pkg.scripts || {}
                );

                return pkg;
              })
              // file will be linted on commit
              .then((content) => write(`${entry}/package.json`, content))
          );
        })
      )
    )

    .then();
}

/**
 * update readMe.md file in each package
 * @param dirs see updatePackages()
 */
export function updateReadMe(dirs?: string[]): Promise<void> {
  return getDirs()
    .then((entries: Array<string>) =>
      Promise.all(
        (dirs || entries).map((entry: string) => {
          read(`${entry}/package.json`)
            // if ${entry}/package.json not exists, use rootData
            .catch((err) => {
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
                entries,
              });

              return content;
            })
            .then((content) => write(`${entry}/README.md`, content));
        })
      )
    )
    .then();
}

export function addTsconfig(
  dirs?: string[] | Promise<string[]>
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

  return Promise.resolve(dirs || getDirs()).then((dirs) =>
    dirs
      .filter((dir) => !existsSync(`${dir}/tsconfig.json`))
      .map((dir) => writeFileSync(`${dir}/tsconfig.json`, content))
  );
}

export function addWebpackConfig(
  dirs?: string[] | Promise<string[]>
): Promise<void[]> {
  let content = `
  import webpackMerge from 'webpack-merge';
  import { Configuration } from 'webpack';
  import baseConfig from '~~webpack.config';
  import { resolve } from 'node:path';
  import { getEntries, read } from '@engineers/nodejs/fs-sync';
  
  let tsConfig = read(resolve(__dirname, 'tsconfig.json'));
  let entry:{[key:string]:string} = {};
  let pattern = new RegExp(\`\${__dirname}\/(.+)\.ts$\`);
  getEntries(__dirname, /(?<!\.config|\.spec)\.ts$/).forEach((file) => {
    entry[file.match(pattern)[1]] = file;
  });
  
  export default webpackMerge(baseConfig, {
    entry,
    output: {
      path: resolve(__dirname, tsConfig.compilerOptions.outDir),
    },
  });
`;

  return Promise.resolve(dirs || getDirs()).then((dirs) =>
    dirs
      .filter((dir) => !existsSync(`${dir}/webpack.config.ts`))
      .map((dir) => writeFileSync(`${dir}/webpack.config.ts`, content))
  );
}

export function addJestConfig(
  dirs?: string[] | Promise<string[]>
): Promise<void[]> {
  let content = `
   import jestConfig from '../../jest.config';
   export default Object.assign({}, jestConfig, {
    testMatch: [\`${__dirname}/**/*.spec.ts\`],
   });
`;

  return Promise.resolve(dirs || getDirs()).then((dirs) =>
    dirs
      .filter((dir) => !existsSync(`${dir}/jest.config.ts`))
      .map((dir) => writeFileSync(`${dir}/jest.config.ts`, content))
  );
}

export function addSemanticReleaseConfig(
  dirs?: string[] | Promise<string[]>
): Promise<void[]> {
  return Promise.resolve(dirs || getDirs()).then((dirs) =>
    dirs
      .filter((dir) => !existsSync(`${dir}/release.config.js`))
      .map((dir) => {
        let file = `release.${
          dir.startsWith('projects/') ? 'app' : 'package'
        }.config.js`;

        let content = `
          let baseConfig= require("../../${file}");
          module.exports = baseConfig;
        `;
        writeFileSync(`${dir}/release.config.js`, content);
      })
  );
}

/**
 * get a list of packages and/or projects
 */
export function getDirs(
  targets: string[] = ['./packages', './projects']
): Promise<Array<string>> {
  return Promise.all(targets.map((dir) => getEntries(dir, 'dirs', 0))).then(
    // combine an array of arrays into a single array
    (results) => results.reduce((acc, current) => acc.concat(current), [])
  );
}
