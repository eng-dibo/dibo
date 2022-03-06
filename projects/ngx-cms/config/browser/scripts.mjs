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
          .then((el) => console.log("adsense loaded"))
          .catch((err) => console.error("adsense failed to load", err));
      }
    });

  

    // add a `copy` button to each article.
    // or for SSR add this code inside ngOnInit(), inject DOCUMENT, and use isPlatformServer
    // todo: add tooltip

    document.querySelectorAll("mat-card").forEach((card) => {
      let copy = document.createElement("span");
      copy.setAttribute("class", "material-icons");
      copy.setAttribute("style", "cursor:pointer");
      copy.innerHTML = "content_copy";
      copy.onclick = function () {
        let title = card.getElementsByTagName("mat-card-title")[0],
          titleText = title.textContent,
          // todo: shorten link -> /$type/~$id
          link = title.getElementsByTagName("a")[0].href,
          content = card.getElementsByTagName("mat-card-content")[0],
          // todo: intro is the text before the first <h2> element
          intro = content.textContent.substr(0, 500),
          headers = [...content.querySelectorAll("h2")]
            .map((el) => el.textContent)
            .join("\r\r"),
          learnMore = "learn more";

        let url = new URL(link);
        url.pathname = url.pathname.replace(
          /([^\/]+)\/(?:[^\/]+)\/.+~([^\/?]+)/,
          "$1/~$2"
        );
        link = url.href;

        let data = `${titleText}\n\n${intro}\n${headers}\n\n${learnMore}👇👇\n${link}`;

        if (navigator.clipboard) {
          navigator.clipboard.writeText(data).then(
            function () {
              // todo: add a tooltip to the copy button
              console.log(`copied!!`);
            },
            function (err) {
              console.error("Async: Could not copy text: ", err);
            }
          );
        } else {
          // https://dev.to/tqbit/how-to-use-javascript-to-copy-text-to-the-clipboard-2hi2
          let area = document.createElement("textarea");
          area.value = data;
          document.body.appendChild(area);
          area.select();
          if (document.execCommand("copy")) {
            console.log(`copied!!`);
          }
          document.body.removeChild(area);
        }
      };
      card.getElementsByTagName("mat-card-header")[0].appendChild(copy);
    });
  }, 1000);
});
