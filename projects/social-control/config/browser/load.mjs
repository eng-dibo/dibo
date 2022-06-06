// loads a script and returns  promise
// copied from @engineers/dom/load
/**
 *
 * @param source
 * @param attributes
 * @param type
 * @param parent
 */
export default function load(
  source,
  attributes = {},
  // "script" | "css" | "link" | "module"
  type,
  parent
) {
  return new Promise((resolve, reject) => {
    if (!type) {
      let fileExtension = (source.split(".").pop() || "").toLowerCase();
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
      attributes.href = source;

      attributes.crossorigin = true;
    } else if (type === "script" || type === "module") {
      attributes.src = source;
      attributes.type = type === "module" ? type : "text/javascript";
    }

    if (!("async" in attributes)) {
      attributes.async = true;
    }

    let element = document.createElement(type === "link" ? "link" : "script");
    for (let key in attributes) {
      if (attributes.hasOwnProperty(key)) {
        element.setAttribute(key, attributes[key]);
      }
    }

    element.addEventListener("load", () => {
      resolve(element);
    });

    element.addEventListener("error", (error) => {
      reject(error);
    });

    (parent || document.head || document.body).append(element);
  });
}
