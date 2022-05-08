/**
 * a js module to load custom scripts
 * examples:
 * import(`./another-module.js`).then(()=>{ console.log('script loaded') })   *
 * load(`font.css`).then(()=>{ console.log(' font loaded')})
 */

import load from "./load.mjs";

// or document.DOMContentLoaded: document loaded, without resources (images, css, ...)
window.addEventListener("load", () => {
  // to ensure that the document is ready give a 1 second delay
  // without that, sometimes `cards` = 0
  setTimeout(() => {
    import("./values.mjs").then((values) => {
      // Google Analytics
      if ((values.googleAnalytics || "").trim() !== "") {
        import(
          `https://www.googletagmanager.com/gtag/js?id=${values.googleAnalytics}`
        ).then(() => {
          window.dataLayer = window.dataLayer || [];
          function gtag() {
            dataLayer.push(arguments);
          }
          gtag("js", new Date());
          gtag("config", values.googleAnalytics);
        });
      }

      // adsense
      if (
        (values.adsense || "").trim() !== "" &&
        document.querySelector("mat-card")
      ) {
        load("//pagead2.googlesyndication.com/pagead/js/adsbygoogle.js", {
          "data-ad-client": values.adsense,
        })
          .then((el) => console.log(`adsense loaded ${values.adsense}`))
          .catch((err) => console.error("adsense failed to load", err));
      }
    });
  }, 1000);
});
