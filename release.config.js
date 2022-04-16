/**
 * configs for schematic-release
 * https://github.com/semantic-release/semantic-release/blob/master/docs/usage/configuration.md#branches
 *
 * you need to set the environments NPM_TOKEN and GITHUB_TOKEN
 * https://github.com/semantic-release/github/blob/master/README.md#github-authentication
 * https://dev.to/github/the-githubtoken-in-github-actions-how-it-works-change-permissions-customizations-3cgp
 *
 * @example
 * export NPM_TOKEN=npm_8Optn***H4x20mwf
 * export GITHUB_TOKEN=ghp_CQX0***16zl
 */
let config = {
  branches: [
    "+([0-9])?(.{+([0-9]),x}).x",
    "main",
    "master",
    "next",
    "next-major",
    { name: "beta", prerelease: true },
    { name: "alpha", prerelease: true },
  ],
  // default plugins
  // todo: run `npm run build` before publishing via @semantic-release/npm or @semantic-release/githu
  plugins: [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    "@semantic-release/changelog",
    "@semantic-release/github",
    // use pkgRoot to flatten the package (i.e put dist contents in the package's root)
    // when using the option { pkgRoot: 'dist' }, use `@semantic-release/git` to update the source package.json
    // or use @semantic-release/exec:prepareCmd after it to sync package.json to the root
    // example: https://github.com/semantic-release/npm#examples
    // keep it after all other plugins but before `@semantic-release/git` to publish the final changes to npm
    ["@semantic-release/npm", { pkgRoot: "dist" }],

    // keep it after all other plugins to commit all changes made by other plugins
    // todo: set assets to commit all changed files `{ assets: ["**/*.*"] }`
    // todo: exclude .gitignore contents https://github.com/semantic-release/git/issues/347
    "@semantic-release/git",
  ],

  extends: ["semantic-release-monorepo"],
};
module.exports = config;

/**
 * replaces plugins options, keeping the same order, or add a new one if not existing
 */
module.exports.replace = function (key, value) {
  let index = config.plugins.findIndex((el) => {
    return typeof el === "string" ? el === key : el[0] === key;
  });

  if (~index) {
    config.plugins[index] = value;
  } else {
    config.plugins.push(value);
  }
  // for chaining multiple replaces i.e: config.replace(..).replace(..)
  return config;
};
