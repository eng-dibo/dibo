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
module.exports = {
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
    "@semantic-release/github",
    "@semantic-release/npm",
  ],

  extends: ["semantic-release-monorepo"],
};
