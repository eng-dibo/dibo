/*
 use this module to dynamically require a module by an expression
 add this file (i.e native-require.js) to webpack.config.module.noParse
 This module exports the native nodejs require, 
 and is parsed by webpack and exports the real `require`
 since the module is unparsed, do not use es6 exports

 example:
   webpack.config.js:
     {
     module: {
       noParse: /\/native-require.js$/,
     }
      }
   
   file.js:
   import nativeRequire = require('./native-require')
   const someModule = nativeRequire('./module.js')  
*/

/**
 * @deprecated
 * has an issue in windows https://github.com/webpack/webpack/issues/15975
 * use webpack magic comments or webpack-specific variables
 *
 * examples:
 *  require(/* webpackIgnore: true *\/ "module");
 *  import(/* webpackIgnore: true *\/ "module");
 * __webpack_require__("module") (not recommended a it lock your project to work with webpack only)
 *
 * https://webpack.js.org/api/module-methods/#magic-comments
 * https://webpack.js.org/api/module-variables/#__non_webpack_require__-webpack-specific
 */
module.exports = require;
