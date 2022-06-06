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

    // use pkgRoot to flatten the package (i.e put dist contents in the package's root)
    // this will update dist/package.json, you need to manually update package.json in the root
    // and use `@semantic-release/git` to commit it
    ["@semantic-release/npm", { pkgRoot: "dist", tarballDir: "tarball!!" }],
    // keep it after `@semantic-release/npm` to add the created tarball to assets
    [
      "@semantic-release/github",
      {
        assets: [
          {
            //  to add all files in dist: "dist/**/*.*",
            path: "tarball!!/**/*.*",
          },
        ],
      },
    ],

    // keep it after all other plugins to commit all changes made by other plugins
    // todo: set assets to commit all changed files `{ assets: ["**/*.*"] }`
    // this will add all files, not only modified ones
    // todo: exclude .gitignore contents https://github.com/semantic-release/git/issues/347
    [
      "@semantic-release/git",
      {
        // todo: add workspace to commit.scope
        // build(pkgName.replace(/(packages|projects)\//,'')):
        message:
          "build: release ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}",
      },
    ],
  ],

  extends: ["semantic-release-monorepo"],
};
module.exports = config;

/**
 * replaces plugins options, keeping the same order, or add a new one if not existing
 *
 * @param key
 * @param value
 */
module.exports.replace = function (key, value) {
  let index = config.plugins.findIndex((element) => {
    return typeof element === "string" ? element === key : element[0] === key;
  });

  if (~index) {
    config.plugins[index] = value;
  } else {
    config.plugins.push(value);
  }
  // for chaining multiple replaces i.e: config.replace(..).replace(..)
  return config;
};
