/* eslint-disable sort-keys */
// todo: create a task to install missing eslint plugins and parsers (from top scope and overrides), run as postinstall
// `npm i -D eslint-plugin-$plugin-name
// plugins.map(el=>!el.startsWith('@')?el.startsWith('eslint-plugin')?el:'eslint-plugin-'+el: ..)

module.exports = {
  // lint all file types, add plugins or parsers for unsupported types
  // todo: is this replaces the cli option `--ext` that is set to '.js' only by default?
  // todo: fix "Unexpected top-level property files"
  // files: ["**/*.*"],
  // ext: ".*",
  env: {
    browser: true,
    es6: true,
    jest: true,
  },

  // to search eslint plugins: https://www.npmjs.com/search?q=keywords%3Aeslint-plugin
  // to learn more about a plugin https://www.npmjs.com/package/eslint-plugin-$pluginName
  // you may apply recommended rules of each plugin
  // by adding $plugin/recommended to extends[]
  // as of projects and packages requirements, add more plugins
  plugins: [
    "@typescript-eslint/eslint-plugin",
    // linting ES6 import/export syntax
    // for example: Ensure imports point to a file/module that can be resolved
    // todo: import VS require-path-exists
    // https://github.com/import-js/eslint-plugin-import/issues/2452
    "import",
    "jsdoc",
    // extends the basic eslint rules
    // https://github.com/typescript-eslint/typescript-eslint/tree/main/packages/eslint-plugin/docs/rules
    "@angular-eslint/eslint-plugin",
    // linting Angular templates
    "@angular-eslint/eslint-plugin-template",
    // prefer arrow function
    "prefer-arrow",
    // best practices for regexp rules and avoid wrong regexp definitions
    "regexp",
    // removes the unused imports
    "unused-imports",
    "unicorn",
    // supports require(), import and webpack aliases
    "require-path-exists",
    "json",
    // linting package.json
    "json-files",
    // linting rules fore nodejs, forked from  eslint-plugin-node
    "n",
    // finds common security issues
    "@microsoft/eslint-plugin-sdl",
    // use 'const' only at the top-level of a module's scope, and 'let' anywhere else
    // set the rule `prefer-const: off`
    "prefer-let",
    // searches for secrets
    "no-secrets",
    "security-node",
    "yaml",
    "anti-trojan-source",
    // sort export statements
    "sort-export-all",
    // identify patterns that will interfere with the tree-shaking algorithm of their module bundler (i.e. rollup or webpack)
    "tree-shaking",
    // Detects when a module has been imported and not listed as a dependency in package.json.
    "implicit-dependencies",
    "@html-eslint",
    "prettier",
  ],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:import/recommended",
    "plugin:import/typescript",
    "plugin:jsdoc/recommended",
    "plugin:regexp/recommended",
    "plugin:unicorn/recommended",
    "plugin:require-path-exists/recommended",
    "plugin:json/recommended",
    "plugin:n/recommended",
    "plugin:@microsoft/sdl/common",
    "plugin:@microsoft/sdl/node",
    // disallows angular-bypass-sanitizer
    // "plugin:@microsoft/sdl/angular",
    "plugin:security-node/recommended",
    "plugin:yaml/recommended",
    "plugin:anti-trojan-source/recommended",
    "plugin:sort-export-all/recommended",
    // todo: Google JavaScript style guide
    // https://google.github.io/styleguide/jsguide.html
    // plugin: https://npmjs.com/package/eslint-config-google
    // "google",
    "plugin:prettier/recommended",
  ],
  parser: "@typescript-eslint/parser",

  // ignoring any non-standard file extensions to solve `the extension for the file () is non-standard`
  // todo: including files without extensions such as `Dockerfile` "**/*",
  ignorePatterns: ["package-lock.json", "**/*.d.ts"],
  // todo: fix: "Unexpected top-level property ignorePath"
  // ignorePath: ".gitignore",
  // override configs for some files
  // the last override block has the highest precedence
  overrides: [
    {
      files: ["**/*.[jt]sx?"],
      parser: "@typescript-eslint/parser",
      parserOptions: {
        /* to solve the error: The file does not match your project config:
         this issue occurs when formatting a file not included in parserOptions.project (i.e: tsconfig.json)

         solutions:
           - ignore this file by .eslintignore or ignorePatterns[]
           - add it to tsconfig.json
           https://stackoverflow.com/a/61959593/12577650
       */
        project: ["tsconfig.json"],
        sourceType: "module",
        extends: [
          "plugin:@typescript-eslint/recommended-requiring-type-checking",
          "plugin:@microsoft/sdl/typescript",
        ],
        rules: {
          // handle promises correctly with `await` or `.then()` and `.catch()`
          "@typescript-eslint/no-floating-promise": "error",
        },
      },
    },
    {
      // linting angular test files to follow best practices for testing
      files: ["**/__tests__/**/*.[jt]sx?", "**/?(*.)+(spec|test).[jt]sx?"],
      extends: [
        "plugin:jest/recommended",
        // todo: enable only for angular projects and packages (starts with ngx-*)
        "plugin:testing-library/angular",
      ],
      plugins: ["jest", "testing-library"],
    },
    {
      files: ["**/*.graphql"],
      parser: "@graphql-eslint/eslint-plugin",
      plugins: ["@graphql-eslint"],
      rules: {
        "@graphql-eslint/known-type-names": "error",
      },
    },
    {
      files: ["*.json", "*.json5", "*.jsonc"],
      parser: "jsonc-eslint-parser",
    },
    {
      files: ["*.ejs.*"],
      // parse files as ejs code instead of normal js
      // ejs files contains invalid js tokens
      // example: `class <%= className %>{}`
      plugins: ["ejs"],
    },
    {
      files: ["*.html", "*.htm"],
      parser: "@html-eslint/parser",
      extends: ["plugin:@html-eslint/recommended"],
    },
  ],

  // https://eslint.org/docs/rules/
  // also see docs for each plugin
  // use https://www.npmjs.com/package/eslint-rule-docs to find docs for a rule
  rules: {
    // sort object keys alphabetically
    // use eslint-plugin-sort-keys-fix to enable auto fixing
    "sort-keys": ["warn", "asc", { minKeys: 5 }],
    "prefer-let/prefer-let": 2,
    "prefer-const": "off",
    "no-secrets/no-secrets": [
      "error",
      {
        // ignore links
        ignoreContent: ["https?://"],
      },
    ],
    "sort-imports": "warn",
    "json-files/sort-package-json": "warn",
    "json-files/ensure-repository-directory": "warn",
    "json-files/require-engines": "warn",
    // prevent duplicate packages in dependencies and devDependencies
    "json-files/require-unique-dependency-names": "error",
    // "tree-shaking/no-side-effects-in-initialization": "error",
    "implicit-dependencies/no-implicit": [
      "error",
      { dev: true, peer: true, optional: true },
    ],
    "no-unused-vars": "off",
    "@typescript-eslint/no-unused-vars": "off",
    // unsupported es features are supported by typescript
    "n/no-unsupported-features/es-syntax": "off",
    // todo: enable this rule to search for all `any` to replace it with a more strict type
    "@typescript-eslint/no-explicit-any": "off",
    // todo: enable this rule after migrating into esm
    "unicorn/prefer-module": "off",
    "jsdoc/require-param-type": "off",
    // allow @ts-ignore
    "@typescript-eslint/ban-ts-comment": "off",
    "@typescript-eslint/no-empty-function": "off",
    "unicorn/consistent-function-scoping": "warn",
    "unicorn/prevent-abbreviations": [
      "warn",
      {
        replacements: {
          pkg: false,
          opts: false,
        },
      },
    ],
    "prettier/prettier": [
      "error",
      {
        // todo: move to .prettierrc.js
        endOfLine: "auto",
      },
      { usePrettierrc: true },
    ],
  },
};
