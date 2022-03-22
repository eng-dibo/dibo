module.exports = {
  name: "site name",
  // only set baseUrl if it is different than the current host
  baseUrl: undefined,
  // page's canonical link (different for each page)
  url: "/",
  description: "",
  "content-language": "ar,en",
  image: { src: `/assets/site-image.webp` },
  twitter: {
    site: "",
    "site:id": "",
  },
  //page title, site name will be added to title via meta.service
  // default = site name
  title: undefined,
};
