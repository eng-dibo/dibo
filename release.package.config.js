let baseConfig = require("./release.config");

baseConfig.plugins = baseConfig.plugins
  .filter(
    (el) => !["@semantic-release/npm", "@semantic-release/github"].includes(el)
  )
  .push([
    "@semantic-release/npm",
    {
      npmPublish: true,
      pkgRoot: "./dist",
    },
  ]);

module.exports = baseConfig;
