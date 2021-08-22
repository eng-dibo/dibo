export default function (tmplPath, config) {
  config.description =
    "renders an object into a content using `material design`, built on top of `ngx-content-core`";
  config.keywords = [
    "angular",
    "cms",
    "content management system",
    "ngx",
    "material design",
  ];
  config.peerDependencies = {
    "@angular/material": "^12.2.1",
    "ng-lazyload-image": "^9.1.0",
    "ngx-highlightjs": "^4.1.4",
    "ngx-quill": "^14.2.0",
    "ngx-sharebuttons": "^8.0.5",
    "@fortawesome/angular-fontawesome": "^0.9.0",
    "@fortawesome/fontawesome-svg-core": "^1.2.28",
    "@fortawesome/free-brands-svg-icons": "^5.15.4",
    "@fortawesome/free-solid-svg-icons": "^5.15.4",
    "ngx-loading": "^8.0.0",
  };
  return config;
}
