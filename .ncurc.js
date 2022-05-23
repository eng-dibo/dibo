// configurations for npm-check-updates
module.exports = {
  // Run recursively in current working directory.
  deep: true,
  // update package.json
  upgrade: true,
  // Include only packages that satisfy engines.node in package.json
  enginesNode: true,
  // Check peer dependencies of installed packages and filter updates to compatible versions
  peer: true,
  target: "minor",
  // don't update @angular/* packages and any other package that angular requires a specific version range
  // use the migration guide to update angular
  reject: ["@angular/*", "typescript", "webpack"],
};
