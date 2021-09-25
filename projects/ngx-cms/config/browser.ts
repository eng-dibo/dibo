import env from './env';
import { Meta } from '@engineers/ngx-utils/meta.service';

export let metaTags: Meta = {
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

export let ADSENSE =
  env.mode === 'development'
    ? //for test https://developers.google.com/admob/android/test-ads
      'ca-app-pub-3940256099942544'
    : //replace with your real adsense account
      'ca-app-pub-3940256099942544';

// todo: all properties for HtmlElement
// todo: move to pkg: html (dynamically create html elements)
// todo: {property: string|()=>string}
// todo: support sub-tags (i.e: {content: string | HtmlElement})
// example: <a> <im /> </a>
export interface HtmlElement {
  tag?: string;
  click?: string | (() => void);
  class?: string;
  id?: string;
  link?: string;
  content?: string;
}

export interface Img extends HtmlElement {
  src?: string;
  width?: string;
  height?: string;
  alt?: string;
}

// todo: ToolbarItem = {Img|...}
export interface ToolbarItem extends HtmlElement {
  title?: string;
}

// todo: img.logo
export let toolbar: ToolbarItem[] = [
  { content: 'jobs', link: '/jobs' },
  { content: 'articles', link: '/' },
  { content: 'follow us', link: '/social' },
  { class: 'spacer' },
  { content: 'login', id: 'member' },
];
