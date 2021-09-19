import { getEntries, read, write } from '@engineers/nodejs/fs';
import { read as readSync } from '@engineers/nodejs/fs-sync';
import { filterObjectByKeys, Obj } from '@engineers/javascript/objects';
import { basename, dirname, resolve } from 'path';
import { existsSync } from 'fs';
import ejs from 'ejs';

const rootPath = resolve('..');

/**
 * generates build files such as package.json, readme.md, etc.
 */
export default function generate(): Promise<void> {
  return generatePackages().then(() => generateReadMe());
}

/**
 * generates package.json files.
 * add fixed properties from package.json in the root dir
 * to other package.json files in all subdirectories.
 *
 * paths are relative to cwd()
 */
function generatePackages(): Promise<void> {
  let rootPackage = readSync('./package.json'),
    // todo: copy `author` to other package.json files only if not existing.
    keys = ['repository', 'homepage', 'bugs', 'license', 'author', 'funding'],
    packages = /^(?!node_modules).+?\/package\.json$/;

  let rootData = filterObjectByKeys(rootPackage as Obj, keys);

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

function generateReadMe(): Promise<void> {
  return Promise.all(
    ['./packages', './projects'].map((dir) => getEntries(dir, 'dirs', 0))
  )
    .then((entries: Array<Array<string>>) => entries[0].concat(entries[1]))
    .then((entries: Array<string>) =>
      Promise.all(
        entries.map((entry: string) => {
          read(`${entry}/package.json`)
            .then((pkg) => {
              pkg = pkg as Obj;

              let about;
              if (existsSync(`${entry}/about.md`)) {
                about = readSync(`${entry}/about.md`);
              } else {
                about = '';
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
