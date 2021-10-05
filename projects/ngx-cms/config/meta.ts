import { Meta } from '@engineers/ngx-utils/meta.service';
import env from './env';

let metaTags: Meta = {
  name: 'site name',
  baseUrl:
    env.mode === 'development'
      ? 'http://localhost:4200/'
      : 'https://www.domain.com/',
  // page's canonical link (different for each page)
  link: 'https://www.domain.com/',
  description: '',
  'content-language': 'ar,en',
  image: { src: `/assets/site-image.webp` },
  twitter: {
    site: 'twitter_account',
    'site:id': 'twitter_account',
  },
  //page title, site name will be added to title via meta.service
  title: 'site title',
};

export default metaTags;
