import { execSync } from 'node:child_process';

/**
 * run maintenance tasks on each push using continuos integration services
 */
export default function maintenance() {
  // link local dependencies
  execSync('npm run task link && npm i --package-lock-only');
  // generate and fix build files, such as readme.md
  execSync('npm run generate');
  // auto fix issues in the code base, such as code style, removing unused imports, checking package.dependencies
  // see .eslintrc.js for all linting tools
  execSync('npm run lint');
  // push the changed files into the main repo
  push();
}

/**
 * push the changed files, ignore if package-lock.json is the only changed file
 */
export function push() {
  let changed = execSync(
    'git add . && git diff-index --cached --name-only HEAD'
  )
    .toString()
    .split('\n')
    .filter((el) => el.trim() !== '' && el.trim() !== 'package-lock.json');

  if (changed.length > 0) {
    // give husky executing permission
    // https://stackoverflow.com/questions/8598639/why-is-my-git-pre-commit-hook-not-executable-by-default#comment88478230_47166916

    execSync('shx chmod +x .husky/pre-commit');
    execSync(
      ' git config user.name ${{ github.actor }} && git config user.email "${{ github.actor }}@github.com"'
    );
    // use --no-verify to bypass husky hooks, as we already run lint
    execSync("git commit -m 'build: maintenance' --no-verify && git push");
  }
}
