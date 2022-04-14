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
  rootData = filterObjectByKeys(rootPackage as Obj, keys);

export interface GenerateOptions {
  // if name provided, create a new package, or update a specific package
  // else update all packages
  name?: string;
  target?: 'packages' | 'projects';
  // other properties of package.json
  [key: string]: any;
}

/**
 * generates build files such as package.json, readme.md, etc.
 */
export default function generate(
  name: string,
  options: GenerateOptions = {}
): Promise<void> {
  if (arguments.length === 2) {
    let { target, ...pkg } = options;
    return create(name, target, pkg).then(() =>
      Promise.all([
        updateReadMe([`${rootPath}/${target}/${name}`]),
        addTsconfig([`${rootPath}/${target}/${name}`]),
        addWebpackConfig([`${rootPath}/${target}/${name}`]),
        addSemanticReleaseConfig([`${rootPath}/${target}/${name}`]),
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
 * create a new project or package
 * todo: if  package exists update it (i.e use the existing package.json)
 * todo: update other readme.md files to add a link to the recently created package
 */
export function create(
  name: string,
  target = 'packages',
  pkgObj: { [key: string]: any }
): Promise<void> {
  let pkg = Object.assign(rootData, {
      name: `@engineers/${name}`,
      version: '0.0.1',
      private: false,
      ...pkgObj,
    }),
    path = `${rootPath}/${target}/${name}`;
  return write(`${path}/package.json`, pkg)
    .then(() =>
      // get existing entries (ie projects and packages) to mention them as good resources
      Promise.all(
        ['./packages', './projects'].map((dir) => getEntries(dir, 'dirs', 0))
      ).then((entries: Array<Array<string>>) => entries[0].concat(entries[1]))
    )
    .then((entries) => {
      // generate readMe.md
      return ejs
        .renderFile(`${rootPath}/tasks/README.tmpl.md`, {
          about: '',
          pkg,
          entries,
        })
        .then((content) => write(`${path}/README.md`, content))
        .then(() => write(`${path}/index.ts`, ''));
    });
}

/**
 * generates package.json files.
 * add fixed properties from package.json in the root dir
 * to other package.json files in all subdirectories.
 *
 * paths are relative to cwd()
 */
export function updatePackages(): Promise<void> {
  return Promise.all(
    ['./packages', './projects'].map((dir) =>
      getEntries(dir, /package\.json$/, 1)
    )
  )
    .then((entries: Array<Array<string>>) =>
      // merge arrays
      entries[0].concat(entries[1])
    )
    .then((entries: Array<string>) =>
      Promise.all(
        entries.map((entry: string) => {
          return (
            read(entry)
              .then((content) => {
                let pkg = Object.assign(
                  {
                    name: '@engineers/' + basename(dirname(entry)),
                    version: '0.0.1',
                    // include only "dist" folder when publishing to npm
                    // in addition to package.json and readme.md
                    // the same as tsconfig.compilerOptions.outDir
                    files: ['dist'],
                  },
                  content,
                  rootData
                );

                pkg.scripts = Object.assign(
                  {
                    build: 'webpack',
                    _publish: 'npm run build && npm publish --access=public',
                    release: 'semantic-release',
                    'release:local': 'semantic-release --no-ci',
                  },
                  pkg.scripts || {}
                );

                return pkg;
              })
              // file will be linted on commit
              .then((content) => write(entry, content))
          );
        })
      )
    )
    .then();
}

/**
 * update readMe.md file in each package
 * @param dirs packages where to update it's readme.md file
 */
export function updateReadMe(
  dirs?: string[] | Promise<string[]>
): Promise<void> {
  return Promise.resolve(dirs || getDirs())
    .then((entries: Array<string>) =>
      Promise.all(
        entries.map((entry: string) => {
          read(`${entry}/package.json`)
            // if ${entry}/package.json not exists, use rootData
            .catch((err) =>
              Object.assign(rootData, {
                name: `@engineers/${entry}`,
                version: '0.0.1',
                private: false,
              })
            )
            .then((pkg) => {
              pkg = pkg as Obj;

              let about;
              if (existsSync(`${entry}/about.md`)) {
                about = readSync(`${entry}/about.md`);
              }

              // todo: use `{{ .. }}` instead of `<% .. %>
              // https://stackoverflow.com/questions/33973388/ejs-2-custom-delimiter/33974027
              let content = ejs.renderFile('./tasks/README.tmpl.md', {
                about,
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
): Promise<void> {
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
): Promise<void> {
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
export function addSemanticReleaseConfig(
  dirs?: string[] | Promise<string[]>
): Promise<void> {
  let content = `
     let baseConfig= require("../../release.config.js");
     module.exports = baseConfig;
`;

  return Promise.resolve(dirs || getDirs()).then((dirs) =>
    dirs
      .filter((dir) => !existsSync(`${dir}/release.config.js`))
      .map((dir) => writeFileSync(`${dir}/release.config.js`, content))
  );
}

/**
 * get a list of packages and/or projects
 */
export function getDirs(
  targets?: string[] = ['./packages', './projects']
): Promise<Array<string>> {
  return Promise.all(targets.map((dir) => getEntries(dir, 'dirs', 0))).then(
    // combine an array of arrays into a single array
    (results) => results.reduce((acc, current) => acc.concat(current), [])
  );
}

// todo: add jest.config.ts
