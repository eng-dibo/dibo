module.exports = {
  // page access token
  // https://developers.facebook.com/docs/messenger-platform/getting-started/quick-start
  access_token: process.env.messenger_access_token,

  // webhook verify token
  // https://developers.facebook.com/docs/messenger-platform/getting-started/webhook-setup
  verify_token: process.env.messenger_verify_token || "ngx-cms",
};
