module.exports = {
  // the App page (i.e the page that is created just for the app)
  // https://developers.facebook.com/docs/messenger-platform/getting-started/quick-start
  page: process.env.page,

  // webhook verify token
  // https://developers.facebook.com/docs/messenger-platform/getting-started/webhook-setup
  verify_token: process.env.messenger_verify_token || "ngx-cms",
};
