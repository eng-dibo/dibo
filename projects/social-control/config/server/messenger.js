module.exports = {
  // the App page (i.e the page that is created just for the app)
  // https://developers.facebook.com/docs/messenger-platform/getting-started/quick-start
  page: process.env.messenger_page,

  // the default app used to generate page access tokens
  // bot = $appId/$pageId
  // each page may linked to multiple apps, each app can take control over the conversation using 'handover protocol'
  app: process.env.messenger_app,

  // webhook verify token
  // https://developers.facebook.com/docs/messenger-platform/getting-started/webhook-setup
  verify_token: process.env.messenger_verify_token || "social-control",
};
