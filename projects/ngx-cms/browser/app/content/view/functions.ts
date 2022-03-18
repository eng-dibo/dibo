import { Params } from './view.component';
import {
  Article,
  Payload,
  Keywords,
  Meta,
} from '@engineers/ngx-content-view-mat';
import { html2text, length } from '@engineers/ngx-content-core/pipes-functions';
import defaultMetaTags from '~config/browser/meta';
import { replaceAll } from '@engineers/javascript/string';

export function getParams(params: any, query: any): Params {
  /*
    examples:
      /articles
      /articles/category.slug
      /articles/category.slug/item.slug~item.id
      /articles/~item.id
  */

  let type = params.type || 'articles',
    category = params.category,
    item = params.item;

  if (category && category.startsWith('~')) {
    item = category;
    category = null;
  }

  return {
    type,
    category,
    // get last part of a string https://stackoverflow.com/a/6165387/12577650
    // using '=' (i.e /slug=id) will redirect to /slug
    item: item && item.indexOf('~') !== -1 ? item.split('~').pop() : item,
    refresh: query.refresh,
    postType: type.slice(-1) === 's' ? type.slice(0, -1) : type,
  };
}

export interface GetUrlOptions {
  category?: any;
  limit?: number;
  offset?: number;
}
export function getUrl(params: any, options: GetUrlOptions = {}): string {
  let opts = Object.assign(
    {
      limit: 10,
    },
    options || {}
  );
  let url = params.type;
  if (params.item) {
    // todo: ~_id,title,subtitle,slug,summary,author,cover,categories,updatedAt
    url += `/${params.item}`;
  } else {
    url += `/${opts.offset}:${opts.limit}@status=approved`;
    if (params.category) {
      url += opts.category
        ? // get articles where category in article.categories[]
          `,categories=${opts.category._id}`
        : // get articles in a category by its slug name
          `,category=${encodeURIComponent('^' + params.category)}`;
    }
  }

  if (params.refresh) {
    url += `?refresh=${params.refresh}`;
  }

  return url;
}

export function transformData(data: Payload, params: Params): Payload {
  if (!data) {
    throw new Error('[transformData] no data');
  }
  if (typeof data === 'string') {
    // ex: the url fetched via a ServiceWorker
    data = JSON.parse(data);
  } else if (!(data instanceof Array) && data.error) {
    throw Error('[view] error while fetching data');
  }

  if (data instanceof Array) {
    data = data
      .map((item: Article) => adjustArticle(item, params, 'list'))
      // randomize (shuffle) data[]
      .sort(() => 0.5 - Math.random()) as Article[];
  } else if (!data.error && data.content) {
    // data may be doesn't 'content' property
    // for example article_categories
    data = adjustArticle(data as Article, params, 'item');
  }

  return data;
}

export function getMetaTags(
  data: Payload,
  params: Params,
  // override tags from `data`
  tags: any = {}
): Meta {
  if (!data) {
    return {};
  }
  let metaTags;
  if (!(data instanceof Array)) {
    if (data.keywords && defaultMetaTags.baseUrl) {
      data.keywords = adjustKeywords(data.keywords, defaultMetaTags);
    }

    metaTags = {
      ...defaultMetaTags,
      // todo: change data.link to data.url
      url: data.link,
      title: data.title,
      author: data?.author?.name,
      description: summary(data.content, { lineBreak: '\n', length: 500 }),
      image: data?.cover || defaultMetaTags?.image,
      ...tags,
      // todo: pass twitter:creator, twitter:creator:id
      // todo: expires
    };
  }
  // todo: category link, title
  else {
    metaTags = { ...defaultMetaTags, url: defaultMetaTags.url + params.type };
  }

  // todo: if(jobs)description=..
  if (!('cover' in metaTags) && params.type === 'jobs') {
    metaTags.image = {
      src: '/assets/site-image/jobs.webp',
      // todo: width, height
    };
  }

  return metaTags;
}

export function adjustArticle(
  item: Article,
  params: Params,
  type: 'item' | 'list' = 'item'
): Article {
  item.id = item._id;
  item.summary = summary(item.content);
  if (item.cover) {
    // if the layout changed, change the attribute sizes, for example if a side menu added.
    // todo: i<originalSize/250
    let src = `/api/v1/image/${params.type}-cover-${item._id}/${item.slug}.webp`,
      srcset = '',
      // for type=item: image width = 100% of the viewport width
      // for type=list: each column is adjusted to be ~250px (by css media queries)
      // or: 1000->25vw (4 cols), 750->33vw (3cols), 500->50vw (2cols), default=100vw
      sizes = type === 'item' ? '100vw' : '250px';
    for (let i = 1; i < 10; i++) {
      let n = i * 250;
      srcset += `${src}?size=${n} ${n}w, `;
    }

    item.cover = {
      src,
      srcset,
      sizes,
    };
  }

  if (!item.link) {
    item.link = `/${params.type}/${item.slug}~${item.id}`;
  }

  item.author = {
    name: 'author name',
    image: 'assets/avatar-female.png',
    link: '',
  };

  if (type === 'item' && params.type === 'jobs') {
    item.content += `<div id='contacts'>${item.contacts}</div>`;
  }

  if (type === 'list') {
    item.content = item.summary;
    delete item.summary;
  }

  delete item.status;
  delete item.categories;
  delete item._id;
  // todo: remove from database
  delete item.type;
  // delete item.keywords;
  return item;
}

export function adjustKeywords(
  keywords: string | Keywords[],
  defaultTags: Meta
): Keywords[] {
  // error TS2352: Conversion of type 'string' to type 'Keywords[]' may be a mistake
  // because neither type sufficiently overlaps with the other.
  // If this was intentional, convert the expression to 'unknown' first.
  if (typeof keywords === 'string') {
    // @ts-ignore
    (keywords as Keywords[]) = (keywords as string)
      .split(',')
      .map((text: string) => ({ text }));
  }

  return (keywords as Keywords[])
    .filter((el: any) => el.text)
    .map((el: any) => {
      if (!el.link) {
        el.link = `https://www.google.com/search?q=site%3A${
          defaultTags.baseUrl
        }+${replaceAll(el.text, '', '+')}`;
      }

      el.target = '_blank';
      return el;
    });
}

export function summary(value: string, options: any = {}): string {
  let text = html2text(value, { lineBreak: options.lineBreak || 'br' });
  return length(text, options.length || 500);
}
