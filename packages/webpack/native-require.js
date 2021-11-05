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
   import nativeRequire from '$path/native-require'
   let file = '/some/module.js'
   const someModule = nativeRequire(file)  
*/

module.exports = require;
