/**
 * get tmpl vars
 * @param {string} tmplPath the path of the template being parsed
 * @param {*} config tmpl.config
 * @returns
 */
export default function (tmplPath, config) {
  // todo: for packages, packageName = dirname(tmplPath)
  let packageName = "";

  return {
    scope: "engineers",
    packageName,
    repo: "https://github.com/eng-dibo/dibo",
    npm: "https://www.npmjs.com/org/engineers",
    email: "sh.eldeeb.2010+dev.github@gmail.com",
    author: "Sherif Eldeeb",
    license: "MIT",
    funding: [
      {
        type: "paypal",
        url: "https://paypal.me/group99001",
      },
      {
        type: "patreon",
        url: "https://www.patreon.com/GoogleDev",
      },
    ],
  };
}
