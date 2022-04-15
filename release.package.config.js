let config = require("./release.config");

config.replace("@semantic-release/npm", [
  "@semantic-release/npm",
  {
    npmPublish: true,
    // use pkgRoot to flatten the package (i.e put dist contents in the package's root)
    // use @semantic-release/exec:prepareCmd after it to sync package.json to the root
    // or @semantic-release/git
    pkgRoot: "dist",
  },
]);
config.plugins = config.plugins.filter(
  (el) => !["@semantic-release/github"].includes(el)
);

config.plugins.push([
  "@semantic-release/exec",
  {
    // use 'replace-json-property' to update the package's version
    // https://www.npmjs.com/package/replace-json-property
    prepareCmd:
      "npx replace-json-property package.json version ${nextRelease.version}",
  },
]);

module.exports = config;
