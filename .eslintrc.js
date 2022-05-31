module.exports = {
  env: {
    browser: true,
    es6: true,
  },

  parser: "@typescript-eslint/parser",

  /* to solve the error: The file does not match your project config:
     this issue occurs when formatting a file not included in parserOptions.project (i.e: tsconfig.json)
     
     solutions:
       - ignore this file by .eslintignore or ignorePatterns[]
       - add it to tsconfig.json
       https://stackoverflow.com/a/61959593/12577650
   */

  // ignoring any non-standard file extensions
  // including files without extensions such as `Dockerfile`
  // to solve: he extension for the file () is non-standard
  ignorePatterns: ["package-lock.json"],
  // ignorePath: ".gitignore",
  plugins: [
    "eslint-plugin-import",
    "eslint-plugin-jsdoc",
    "@angular-eslint/eslint-plugin",
    "@angular-eslint/eslint-plugin-template",
    "eslint-plugin-prefer-arrow",
    "@typescript-eslint",
    "@typescript-eslint/tslint",
  ],
  rules: {},
  overrides: [
    {
      files: ["*.ts", "*.tsx"],
      parserOptions: {
        project: ["./tsconfig.json"],
      },
      extends: [
        "eslint:recommended",
        "plugin:@typescript-eslint/recommended",
        "plugin:@typescript-eslint/recommended-requiring-type-checking",
      ],
    },
  ],
};
