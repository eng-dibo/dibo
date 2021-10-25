import { Meta } from '@engineers/ngx-utils/meta.service';
import env from './env';

let metaTags: Meta = {
  name: 'site name',
  baseUrl:
    env.mode === 'development'
      ? 'http://localhost:4200/'
      : process.env.meta_baseUrl,
  // page's canonical link (different for each page)
  link: process.env.meta_baseUrl,
  description: '',
  'content-language': 'ar,en',
  image: { src: `/assets/site-image.webp` },
  twitter: {
    site: process.env.meta_twitterAccount,
    'site:id': process.env.meta_twitterAccount,
  },
  //page title, site name will be added to title via meta.service
  title: 'ngx-cms',
};

export default metaTags;
