export default function (tmplPath, config) {
  config.description = "automates most of mongoose work";
  config.keywords = ["mongoose", "mongodb", "database"];
  config.peerDependencies = { mongoose: "^5.13.2", shortid: "^2.2.16" };
  // a long description, used in README.md instead of the short `config.description`
  config.intro = `[mongoose](https://www.npmjs.com/package/mongoose) is a [MongoDB](https://www.mongodb.org/) object modeling tool designed to work in an asynchronous environment. Mongoose supports both promises and callbacks.

  this package automates most of mongoose work.
  also it supports full backup and restore functionality.`;
  return config;
}
