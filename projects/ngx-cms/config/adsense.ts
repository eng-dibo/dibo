import env from './env';

export default env.mode === 'development'
  ? // for test https://developers.google.com/admob/android/test-ads
    'ca-app-pub-3940256099942544'
  : // replace with your real adsense account
    process.env.adsense || 'ca-app-pub-3940256099942544';
