import { getEntries, read, write } from '@engineers/nodejs/fs';
import { read as readSync } from '@engineers/nodejs/fs-sync';
import { filterObjectByKeys, Obj } from '@engineers/javascript/objects';
import { resolve } from 'path';

const rootPath = resolve('..');

/**
 * generates build files such as package.json, readme.md, etc.
 */
export default function generate(): Promise<void> {
  return generatePackages();
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
              .then((content) => Object.assign(content, rootData))
              // todo: lint
              .then((content) => write(entry, content))
          );
        })
      )
    )

    .then();
}
