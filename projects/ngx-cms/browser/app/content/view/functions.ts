import { Params, Category } from './view.component';
import {
  Article,
  Payload,
  Keywords,
  Meta,
} from '@engineers/ngx-content-view-mat';
import {
  html2text,
  length,
  slug as _slug,
} from '@engineers/ngx-content-core/pipes-functions';
import { replaceAll } from '@engineers/javascript/string';

export function slug(value: string, options: any = {}) {
  return _slug(
    value,
    Object.assign(
      {
        length: 200,
        allowedChars: ':ar',
        encode: false,
      },
      options
    )
  );
}

export function getParams(router: { params?: any; queryParams?: any }): Params {
  /*
    examples:
      /articles
      /articles/category.slug
      /articles/category.slug/item.slug~item.id
      /articles/~item.id
  */

  let params = router.params,
    query = router.queryParams,
    type = params.type || 'articles',
    category = params.category,
    item = params.item;

  if (category && category.startsWith('~')) {
    item = category;
    category = null;
  }

  return {
    type,
    category: { slug: category },
    // get last part of a string https://stackoverflow.com/a/6165387/12577650
    // using '=' (i.e /slug=id) will redirect to /slug
    item: item && item.indexOf('~') !== -1 ? item.split('~').pop() : item,
    refresh: query.refresh,
    postType: type.slice(-1) === 's' ? type.slice(0, -1) : type,
  };
}

export interface GetUrlOptions {
  limit?: number;
  offset?: number;
}
export function getUrl(params: any, options: GetUrlOptions = {}): string {
  let url = `${params.type}/`;
  if (params.item) {
    // todo: ~_id,title,subtitle,summary,author,cover,categories,updatedAt
    url += params.item;
  } else {
    url += `${options.offset || 0}:${options.limit || 10}@status=approved`;
    if (params.category.slug) {
      url += params.category._id
        ? // get articles where category in article.categories[]
          `,categories=${params.category._id}`
        : // get articles in a category by its slug name
          `,category=${encodeURIComponent('^' + params.category.slug)}`;
    }
  }

  if (params.refresh) {
    url += `?refresh=${params.refresh}`;
  }

  return url;
}

export function transformData(
  data: Payload,
  params: Params,
  categories?: Category[]
): Payload {
  if (!data) {
    throw new Error('[transformData] no data');
  }
  if (typeof data === 'string') {
    // ex: the url fetched via a ServiceWorker
    data = JSON.parse(data);
  } else if (!(data instanceof Array) && data.error) {
    // todo: cause
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error/Error#rethrowing_an_error_with_a_cause
    throw new Error(
      '[view] error while fetching data' /*, {cause:data.error}*/
    );
  }

  if (data instanceof Array) {
    data = data
      .map((item: Article) => adjustArticle(item, params, categories, 'list'))
      // randomize (shuffle) data[]
      .sort(() => 0.5 - Math.random()) as Article[];
  } else if (!data.error && data.content) {
    // data may be doesn't 'content' property
    // for example article_categories
    data = adjustArticle(data as Article, params, categories, 'item');
  }

  return data;
}

export function getMetaTags(
  data: Payload,
  params: Params,
  // override tags from `data`
  defaultMetaTags: Meta = {}
): Meta {
  if (!data) {
    return defaultMetaTags;
  }
  let metaTags: Meta;
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
      ...defaultMetaTags,
      // todo: pass twitter:creator, twitter:creator:id
      // todo: expires
    };
  }
  // todo: category link, title
  else {
    metaTags = {
      ...defaultMetaTags,
      url: defaultMetaTags.url + params.type,
      title: defaultMetaTags.name,
    };
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
  categories?: Array<Category>,
  type: 'item' | 'list' = 'item'
): Article {
  item.id = item._id;
  item.summary = summary(item.content);

  // todo: param.category || item.categories[0] || config.general
  let category;
  if (item.categories && item.categories.length > 0 && categories) {
    category = categories.find((el) => el._id === item.categories[0]);
  }
  item.slug = category ? category.slug || slug(category.title!) : 'general';
  item.slug += '/' + slug(item.title);
  item.link = `/${params.type}/${item.slug}~${item.id}`;

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

  if (type === 'item' && params.type === 'jobs') {
    item.content += `<div id='contacts'>${item.contacts}</div>`;
  }

  if (type === 'list') {
    item.content = item.summary;
  }

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
