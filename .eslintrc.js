/* eslint-disable sort-keys */
// todo: enable all disabled rules, and level "warn" rules up to "error"
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
    jasmine: true,
  },

  // ignoring any non-standard file extensions to solve `the extension for the file () is non-standard`
  // todo: including files without extensions such as `Dockerfile` "**/*",
  // files in .gitignore are ignored by the cli option `--ignore-path=.gitignore`
  // node_modules and dot files (.eslintrc) are ignored
  ignorePatterns: [
    "package-lock.json",
    "**/LICENSE",
    "**/Dockerfile",
    "**/*.Dockerfile",
    "resources/highlight-js/**",
    // todo: ignore all media and fonts files
    // todo: extended pattern doesn't work, temporarily use each pattern separately
    // https://github.com/eslint/eslint/issues/15958
    "**/*.{d.ts,d.mts,log,txt,webp,jpg,jpeg,png,gif,mp3,mp4,ico,webmanifest}",
    "**/*.d.ts",
    "**/*.d.mts",
    "**/*.txt",
    "**/*.jpg",
    "**/*.png",
    "**/*.webp",
    "**/*.ico",
    "**/*.webmanifest",
    // todo: https://github.com/ota-meshi/eslint-plugin-css/issues/34
    // https://github.com/atfzl/eslint-plugin-css-modules/issues/74
    "**/*.css",
    "**/*.scss",
    // todo: temporary
    "**/webpack.config.ts",
    "**/*.html",
  ],

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
    "css",
    // todo: css vs css-modules
    "css-modules",
    "markdown",
  ],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:import/recommended",
    "plugin:import/typescript",
    "plugin:jsdoc/recommended",
    // todo: enable these rules
    // "plugin:regexp/recommended",
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
    "plugin:css/recommended",
    "plugin:css-modules/recommended",
    // lints inline angular templates i.e: inside .ts files
    // or move to *.(?:component|directive|pipe|...).ts
    // "plugin:@angular-eslint/template/process-inline-templates",
    "plugin:markdown/recommended",
  ],

  // https://eslint.org/docs/rules/
  // also see docs for each plugin
  // use https://www.npmjs.com/package/eslint-rule-docs to find docs for a rule
  rules: {
    // sort object keys alphabetically
    // todo: use eslint-plugin-sort-keys-fix to enable auto fixing
    "sort-keys": ["warn", "asc", { minKeys: 5 }],
    "prefer-let/prefer-let": 2,
    "prefer-const": "off",
    // this rule is "warn" because it many times reports normal text
    "no-secrets/no-secrets": [
      "warn",
      {
        // ignore links
        // todo: ignore any string inside code comments
        ignoreContent: ["https?://"],
      },
    ],
    "sort-imports": [
      "warn",
      {
        // todo: disable this option https://github.com/eslint/eslint/issues/15957
        // temporarily use ignoreDeclarationSort
        memberSyntaxSortOrder: ["none", "single", "all", "multiple"],
        allowSeparatedGroups: true,
        ignoreDeclarationSort: true,
      },
    ],
    "json-files/sort-package-json": "warn",
    "json-files/ensure-repository-directory": "warn",
    "json-files/require-engines": "warn",
    // prevent duplicate packages in dependencies and devDependencies
    "json-files/require-unique-dependency-names": "error",
    "tree-shaking/no-side-effects-in-initialization": "off",
    // todo: VS 'node/no-extraneous-import'
    // todo: reports native modules https://github.com/lennym/eslint-plugin-implicit-dependencies/issues/7
    "implicit-dependencies/no-implicit": [
      "off",
      { dev: true, peer: true, optional: true },
    ],
    "n/no-unpublished-import": "warn",
    // the rules 'n/no-missing-import' and 'require-path-exists/exists' cannot find tsconfig.paths
    "n/no-missing-import": "off",
    "n/no-missing-require": "off",
    "require-path-exists/exists": [
      "off",
      {
        webpackConfigPath: "webpack.config.ts",
        extensions: ["", ".js", ".ts", ".json", ".node"],
      },
    ],

    // todo: switch to 'error' after resolving the commented issues
    "n/no-extraneous-import": [
      "warn",
      {
        allowModules: [
          "@jest/globals",
          // todo: use wildcards or regex
          // https://github.com/mysticatea/eslint-plugin-node/issues/332
          "@engineers/cache",
          "@engineers/databases",
          "@engineers/dom",
          "@engineers/express-redirect-middleware",
          "@engineers/firebase-admin",
          "@engineers/gcloud-storage",
          "@engineers/graphics",
          "@engineers/hookable",
          "@engineers/javascript",
          "@engineers/lazy-load",
          "@engineers/mongoose",
          "@engineers/ngx-content-core",
          "@engineers/ngx-content-view-mat",
          "@engineers/ngx-universal-express",
          "@engineers/ngx-utils",
          "@engineers/nodejs",
          "@engineers/rxjs",
          "@engineers/updater",
          "@engineers/webpack",
          // allow packages that are included in the root workspace by default
          "webpack",
          "webpack-merge",
          // todo: use tsconfig.compilerOptions.path
          // todo: this causes eslint to stop formatting .ts files
          // "~~webpack.config",
        ],
        // tryExtensions: [".js", ".ts", ".json", ".node"],
      },
    ],
    "n/no-extraneous-require": [
      "warn",
      {
        allowModules: [
          "@jest/globals",
          // todo: use wildcards or regex
          // https://github.com/mysticatea/eslint-plugin-node/issues/332
          "@engineers/cache",
          "@engineers/databases",
          "@engineers/dom",
          "@engineers/express-redirect-middleware",
          "@engineers/firebase-admin",
          "@engineers/gcloud-storage",
          "@engineers/graphics",
          "@engineers/hookable",
          "@engineers/javascript",
          "@engineers/lazy-load",
          "@engineers/mongoose",
          "@engineers/ngx-content-core",
          "@engineers/ngx-content-view-mat",
          "@engineers/ngx-universal-express",
          "@engineers/ngx-utils",
          "@engineers/nodejs",
          "@engineers/rxjs",
          "@engineers/updater",
          "@engineers/webpack",
          // allow packages that are included in the root workspace by default
          "webpack",
          "webpack-merge",
          // todo: use tsconfig.compilerOptions.path
          // todo: this causes eslint to stop formatting .ts files
          // "~~webpack.config",
        ],
        // tryExtensions: [".js", ".ts", ".json", ".node"],
      },
    ],
    "no-unused-vars": "off",
    "@typescript-eslint/no-unused-vars": "off",
    // todo: enable this rule to search for all `any` to replace it with a more strict type
    "@typescript-eslint/no-explicit-any": "off",
    // allow @ts-ignore
    "@typescript-eslint/ban-ts-comment": "off",
    "@typescript-eslint/no-empty-function": "off",
    "@typescript-eslint/no-var-requires": "warn",
    "@typescript-eslint/no-non-null-assertion": "off",
    // unsupported es features are supported by typescript
    "n/no-unsupported-features/es-syntax": "off",
    "n/no-unsupported-features/es-builtins": "warn",
    // todo: set engines.node in package.json then switch to "error"
    "n/no-unsupported-features/node-builtins": "warn",
    // todo: enable this rule after migrating into esm
    "unicorn/prefer-module": "off",
    "unicorn/no-array-for-each": "off",
    "unicorn/no-empty-file": "warn",
    // prevents `array.map(function)` because function signature may be different
    "unicorn/no-array-callback-reference": "off",
    "unicorn/better-regex": "warn",
    "jsdoc/require-param-type": "off",
    "unicorn/consistent-function-scoping": "warn",
    "unicorn/prevent-abbreviations": [
      "warn",
      {
        replacements: {
          pkg: false,
          opts: false,
          obj: false,
          // todo: replace with `elementRef` or `Ref`
          // https://github.com/sindresorhus/eslint-plugin-unicorn/issues/1839
          ref: false,
          args: false,
          config: false,
        },
      },
    ],
    "unicorn/prefer-spread": "warn",
    "unicorn/import-style": "warn",
    "prettier/prettier": [
      "error",
      {
        // todo: move to .prettierrc.js
        endOfLine: "auto",
      },
      { usePrettierrc: true },
    ],
    "no-prototype-builtins": "warn",
    "@html-eslint/indent": "warn",
    "@html-eslint/element-newline": "warn",
    "security-node/non-literal-reg-expr": "warn",
    // todo: read why 'null' should be replaced with 'undefined'
    // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/v42.0.0/docs/rules/no-null.md#why
    "unicorn/no-null": "warn",
    "unicorn/consistent-destructuring": "warn",
    "unicorn/explicit-length-check": "warn",
    "no-useless-escape": "warn",
    "no-empty": "warn",
    // todo: VS n/no-extraneous-import
    "import/no-unresolved": "off",
    "prefer-rest-params": "warn",
  },

  // todo: fix: "Unexpected top-level property ignorePath"
  // ignorePath: ".gitignore",
  // override configs for some files
  // the last override block has the highest precedence
  overrides: [
    {
      // todo: move all typescript, javascript rules here
      files: ["*.{m,}{ts,js,tsx,jsx"],
      parser: "@typescript-eslint/parser",
      parserOptions: {
        // todo: use tsconfig for each workspace (fallback to the nearest tsconfig file)
        project: ["tsconfig.all.json"],
        sourceType: "module",
      },
      extends: [
        "plugin:@typescript-eslint/recommended-requiring-type-checking",
        "plugin:@microsoft/sdl/typescript",
      ],
      rules: {
        // todo: move to top-level rules
        // to override "plugin:@typescript-eslint/recommended-requiring-type-checking"
        "prefer-const": "off",
        "@typescript-eslint/no-unsafe-member-access": "warn",
        "@typescript-eslint/no-unsafe-argument": "warn",
        "@typescript-eslint/no-unsafe-return": "warn",
        "@typescript-eslint/no-unsafe-assignment": "warn",
        "@typescript-eslint/no-unsafe-call": "warn",
        "@typescript-eslint/restrict-template-expressions": "warn",
        "@typescript-eslint/restrict-plus-operands": "warn",
        "@typescript-eslint/no-misused-promises": "warn",
        // handle promises correctly with `await` or `.then()` and `.catch()`
        // todo: error: Definition for rule '@typescript-eslint/no-floating-promise' was not found
        // https://github.com/typescript-eslint/typescript-eslint/issues/5139
        // https://github.com/typescript-eslint/typescript-eslint/issues/5141
        "@typescript-eslint/no-floating-promises": "warn",
      },
    },
    {
      // linting angular test files to follow best practices for testing
      // todo: extend *.ts rules
      files: [
        "**/__tests__/**/*.{ts,js,tsx,jsx}",
        "**/*.{spec,test}.{ts,js,tsx,jsx}",
      ],
      parserOptions: {
        project: ["tsconfig.spec.json"],
      },
      plugins: ["jest", "testing-library"],
      extends: [
        "plugin:jest/recommended",
        // todo: enable only for angular projects and packages (starts with ngx-*)
        "plugin:testing-library/angular",
      ],
      rules: {
        "prefer-const": "off",
        "jest/no-conditional-expect": "warn",
        "jest/valid-title": "warn",
        "jest/no-done-callback": "warn",
        // todo: allow for expect().resolves
        // https://github.com/jest-community/eslint-plugin-jest/issues/1144
        "jest/valid-expect": "warn",
        "@typescript-eslint/no-floating-promises": "warn",
      },
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
      files: ["*.{json,json5,jsonc}"],
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
      files: ["*.{htm,html}"],
      parser: "@html-eslint/parser",
      extends: ["plugin:@html-eslint/recommended"],
      rules: {
        "@html-eslint/indent": "off",
        // the element may be inside if-else blocks
        // todo: use files:["*.component.html"] to lint angular templates
        "@html-eslint/no-duplicate-id": "warn",
        "@html-eslint/require-closing-tags": "warn",
      },
    },
    /* {
      // lint angular templates
      // todo: error: node.body is not iterable
      files: ["*.component.html"],
      parser: "@angular-eslint/template-parser",
      extends: [
        // "plugin:@html-eslint/recommended",
        "plugin:@angular-eslint/template/recommended",
      ],
    },*/
  ],
};
