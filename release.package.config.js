let config = require("./release.config");

config.plugins = config.plugins.filter(
  (el) => !["@semantic-release/github"].includes(el)
);

config.plugins.push([
  // todo: replace this plugin with script: `postversion`
  // to update package.json after @semantic-release/npm setting dist/packages.json's version
  "@semantic-release/exec",
  {
    // use 'replace-json-property' to update the package's version
    // https://www.npmjs.com/package/replace-json-property
    prepareCmd:
      "npx replace-json-property package.json version ${nextRelease.version}",
  },
]);

module.exports = config;
