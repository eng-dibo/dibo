// npm-check-updates
module.exports = {
  // update package.json
  upgrade: true,
  // update workspaces recursively
  deep: true,
  // Include only packages that satisfy engines.node
  enginesNode: true,
  // Check peer dependencies of installed packages and filter updates to compatible versions
  peer: true,
  // update minor versions only
  target: "minor",
  reject: [
    // angular packages and their dependencies
    // use angular migration guide to update Angular
    "@angular/**",
    "typescript",
    // has breaking change, remove from `reject` after fully migrating the project into esm
    "strip-json-comments",
    // has issue with semantic-release-monorepo
    // https://github.com/semantic-release/npm/issues/492
    // https://github.com/pmowrer/semantic-release-monorepo/issues/121#issuecomment-1120554972
    "@semantic-release/npm",
  ],
};
