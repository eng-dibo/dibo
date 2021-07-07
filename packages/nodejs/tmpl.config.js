export default function (tmplPath, config) {
  config.description = "nodejs utils";
  config.keywords = ["nodejs", "javascript", "js"];
  config.peerDependencies = { "strip-json-comments": "^3.1.1" };
  return config;
}
