// configurations for `tmpl`
//todo: convert to .ts

/**
 * @param {string} tmplPath the path of the template being parsed
 * @param {*} config tmpl.config
 * @returns {object} a new config object
 */
export default function (tmplPath, config) {
  // todo: for packages, packageName = dirname(tmplPath)
  let packageName = "";

  return {
    // todo: merge with the existing config.values{}
    values: {
      // npm organization scope i.e: @scope/package-name
      scope: "engineers",
      // google cloud project id
      gcloud: "dibo-cloud",
      packageName,
      repo: "https://github.com/eng-dibo/dibo",
      npm: "https://www.npmjs.com/org/engineers",
      // eslint-disable-next-line no-secrets/no-secrets
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
      scripts: {
        test: "jest",
      },
    },
  };
}
