let config = require("./release.config");

config.plugins = config.plugins.filter(
  (element) => !["@semantic-release/github"].includes(element)
);

/*
config.plugins.push([
   // to update package.json after @semantic-release/npm setting dist/packages.json's version
  // replaced with script `postversion` 
  "@semantic-release/exec",
  {
    // use 'replace-json-property' to update the package's version
    // https://www.npmjs.com/package/replace-json-property
    prepareCmd:
      "npx replace-json-property package.json version ${nextRelease.version}",
  },
]);*/

module.exports = config;
