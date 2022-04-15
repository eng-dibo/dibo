// disable publishing to npm in apps (non-packages)
let baseConfig = require("./release.config");

baseConfig.plugins = baseConfig.plugins
  .filter((el) => el !== "@semantic-release/npm")
  .push([
    "semantic-release/npm",
    {
      npmPublish: false,
    },
  ]);

module.exports = baseConfig;
