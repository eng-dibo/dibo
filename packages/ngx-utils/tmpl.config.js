export default function (tmplPath, config) {
  config.description = "tools for Angular";
  config.keywords = ["angular", "ngx", "front end"];
  config.intro = `- dynamically inject a component into the DOM.
  - dynamically load resources (js, css, images, ...).
  - manage meta tags.
  - manage routes.
  - rxjs.`;
  return config;
}
