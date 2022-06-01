import { getEntries, read, write } from '@engineers/nodejs/fs-sync';
import { resolve } from 'node:path';

/**
 * searches for local dependencies in all .ts files of each local package
 * and adds them to its package.json dependencies
 * local dependencies are those who live in this monorepo and starts with `@engineers/*`
 */
export default function linkLocalDependencies(): void {
  let rootPath = resolve(__dirname, '..');
  let packages = getEntries('packages', 'dirs', 0);
  for (let packageName of packages) {
    let files = getEntries(
      packageName,
      (file) => file.endsWith('.ts') && !file.includes('node_modules')
    );

    for (let file of files) {
      let content = read(resolve(rootPath, file));
      // pattern: @engineers/ followed by anything except "/", "'" or line break
      let matches = (content as string).matchAll(
        / from '@engineers\/([^\n'/]+)/g
      );

      let packagePath = resolve(rootPath, `${packageName}/package.json`);
      let pkg: any = read(packagePath);
      pkg.dependencies = pkg.dependencies || {};

      for (let match of matches) {
        let linkedPackage = read(
          resolve(rootPath, `packages/${match[1]}/package.json`)
        ) as any;
        pkg.dependencies[`@engineers/${match[1]}`] =
          linkedPackage.version || 'latest';
      }

      // if Promises used, don't write multiple times in parallel to the same package.json
      // instead save all matches per each packageName in a Set<string>
      // and then write the final result at once
      write(packagePath, pkg);
    }
  }
}
