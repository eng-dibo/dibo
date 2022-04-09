module.exports = {
  // purge configuration, the token must have the permission purge:edit for the specified zone
  // set to undefined to disable purging cache
  purge: { purge_everything: true },
  // get token from https://dash.cloudflare.com/profile/api-tokens
  token: undefined,
  zone: undefined,
};
