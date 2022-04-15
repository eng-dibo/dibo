// disable publishing to npm in apps (non-packages)
let config = require("./release.config");

config.replace("@semantic-release/npm", [
  "semantic-release/npm",
  {
    npmPublish: false,
  },
]);

module.exports = config;

console.log(config.plugins);
