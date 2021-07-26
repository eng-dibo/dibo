export default function (tmplPath, config) {
  config.description = "create and modify images via sharp";
  config.keywords = ["images", "graphics", "sharp", "resize images"];

  config.peerDependencies = {
    sharp: "^0.26.3",
  };
  return config;
}
