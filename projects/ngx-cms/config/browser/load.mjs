// loads a script and returns a promise
// copied from @engineers/dom/load

export default function load(
  src,
  attributes = {},
  // "script" | "css" | "link" | "module"
  type,
  parent
) {
  return new Promise((resolve, reject) => {
    if (!type) {
      let fileExtension = (src.split(".").pop() || "").toLowerCase();
      if (fileExtension === "js") {
        type = "script";
      }
      // style sheet
      else if (["css", "scss", "less", "sass"].includes(fileExtension)) {
        type = "css";
      }
      // web fonts
      else if (["EOT", "TTF", "WOFF", "WOFF2"].includes(fileExtension)) {
        type = "link";
      } else {
        type = "link";
      }
    }

    if (type === "css") {
      type = "link";
      attributes.rel = "stylesheet";
      attributes.type = "text/css";
    }

    if (type === "link") {
      attributes.href = src;

      attributes.crossorigin = true;
    } else if (type === "script" || type === "module") {
      attributes.src = src;
      if (type === "module") {
        attributes.type = type;
      } else {
        attributes.type = "text/javascript";
      }
    }

    if (!("async" in attributes)) {
      attributes.async = true;
    }

    let el = document.createElement(type === "link" ? "link" : "script");
    for (let key in attributes) {
      if (attributes.hasOwnProperty(key)) {
        el.setAttribute(key, attributes[key]);
      }
    }

    el.addEventListener("load", () => {
      resolve(el);
    });

    el.addEventListener("error", (error) => {
      reject(error);
    });

    (parent || document.head || document.body).appendChild(el);
  });
}
