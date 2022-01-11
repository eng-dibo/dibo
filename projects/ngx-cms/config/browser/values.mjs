// require() not defined in browser https://sebhastian.com/javascript-require-is-not-defined/
// await import() expects a js module, not json
import info from "./info.json" assert { type: "json" };

export let googleAnalytics = "";

// for testing use 'ca-app-pub-3940256099942544'
// https://developers.google.com/admob/android/test-ads
export let adsense =
  info && info.mode === "production" ? "" : "ca-app-pub-3940256099942544";
