import { Meta } from '@engineers/ngx-utils/meta.service';
import env from './env';

let metaTags: Meta = {
  name: 'site name',
  baseUrl:
    env.mode === 'development'
      ? 'http://localhost:4200/'
      : // todo: replace with our site domain
        '/',
  // page's canonical link (different for each page)
  link: '/',
  description: '',
  'content-language': 'ar,en',
  image: { src: `/assets/site-image.webp` },
  twitter: {
    site: '',
    'site:id': '',
  },
  //page title, site name will be added to title via meta.service
  title: 'ngx-cms',
};

export default metaTags;
