import { getEntries, read, write } from '@engineers/nodejs/fs';
import { read as readSync } from '@engineers/nodejs/fs-sync';
import { filterObjectByKeys, Obj } from '@engineers/javascript/objects';
import { basename, dirname, resolve } from 'path';
import { existsSync } from 'fs';
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
    return create(name, target, pkg);
  } else {
    return updatePackages().then(() => updateReadMe());
  }
}

/**
 * create a new project or package
 * todo: if  package exists update it (i.e use the existing package.json)
 * todo: add jest.config.ts
 * todo: update other readme.md files to add a link to the recently created package
 */
function create(
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
function updatePackages(): Promise<void> {
  let packages = /^(?!node_modules).+?\/package\.json$/;

  return Promise.all(
    ['./packages', './projects'].map((dir) => getEntries(dir, packages))
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
              .then((content) =>
                Object.assign(
                  { name: '@engineers/' + basename(dirname(entry)) },
                  content,
                  rootData
                )
              )
              // file will be linted on commit
              .then((content) => write(entry, content))
          );
        })
      )
    )
    .then();
}

function updateReadMe(): Promise<void> {
  return Promise.all(
    ['./packages', './projects'].map((dir) => getEntries(dir, 'dirs', 0))
  )
    .then((entries: Array<Array<string>>) => entries[0].concat(entries[1]))
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
