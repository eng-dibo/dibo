export default function (tmplPath, config) {
  config.description =
    "convert Angular projects into universal apps using expressjs";
  config.dependencies = {
    // use a version compilable with @angular/common
    // ex: for @angular/common@11.x.x -> install @nguniversal/express-engine@^11
    "@nguniversal/express-engine": "",
    //also install @types/express@^4.15.2
    express: "^4.15.2",
  };
  return config;
}
