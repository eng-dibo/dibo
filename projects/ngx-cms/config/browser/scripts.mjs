/**
 * a js module to load custom scripts
 */

import load from "./load.mjs";

// DOMContentLoaded: document loaded, without resources (images, css, ...)
window.addEventListener("load", () => {
  /*
   * examples:
   * import(`./another-module.js`).then(()=>{ console.log('script loaded') })   *
   * load(`font.css`).then(()=>{ console.log(' font loaded')})
   *
   */
});
