/**
 * a js module to load custom scripts
 */

// or document.DOMContentLoaded: document loaded, without resources (images, css, ...)
window.addEventListener("load", () => {
  // to ensure that the document is ready give a 1 second delay
  // without that, sometimes `cards` = 0

  Promise.all([
    import("./load.mjs").then((module) => module.default),
    import("./values.mjs"),
  ]).then(([load, values]) => {
    // Google Analytics
    if ((values.googleAnalytics || "").trim() !== "") {
      import(
        `https://www.googletagmanager.com/gtag/js?id=${values.googleAnalytics}`
      ).then(() => {
        window.dataLayer = window.dataLayer || [];
        /**
         *
         */
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
        .then((element) => console.log(`adsense loaded ${values.adsense}`))
        .catch((error) => console.error("adsense failed to load", error));
    }
  });
});
