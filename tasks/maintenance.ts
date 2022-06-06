import { execSync as _execSync } from 'node:child_process';

/**
 *
 * @param cmd
 */
function execSync(cmd: string) {
  _execSync(cmd, { stdio: 'inherit' });
}

/**
 * run maintenance tasks on each push using continuos integration services
 *
 * @param options
 */
export default function maintenance(options: PushOptions) {
  // link local dependencies
  execSync('npm run task link && npm i --package-lock-only');
  // generate and fix build files, such as readme.md
  execSync('npm run generate');
  // auto fix issues in the code base, such as code style, removing unused imports, checking package.dependencies
  // see .eslintrc.js for all linting tools
  execSync('npm run lint');
  // push the changed files into the main repo
  push(options);
}

export interface PushOptions {
  user: string;
  email?: string;
}
/**
 * push the changed files, ignore if package-lock.json is the only changed file
 *
 * @param options
 */
export function push(options: PushOptions) {
  console.log('> pushing changed files ...');

  let changed = _execSync(
    'git add . && git diff-index --cached --name-only HEAD'
  )
    .toString()
    .split('\n')
    .filter(
      (element) =>
        element.trim() !== '' && element.trim() !== 'package-lock.json'
    );

  if (changed.length > 0) {
    console.log(`changed files: ${changed.length}`);
    console.log(` - ${changed.join('\n - ')}`);
    options.email = options.email || `${options.user}@github.com`;

    // give husky executing permission
    // https://stackoverflow.com/questions/8598639/why-is-my-git-pre-commit-hook-not-executable-by-default#comment88478230_47166916
    execSync('shx chmod +x .husky/pre-commit');
    execSync(
      `git config user.name ${options.user} && git config user.email "${options.email}"`
    );
    // use --no-verify to bypass husky hooks, as we already run lint
    execSync("git commit -m 'build: maintenance' --no-verify && git push");
  }
}
