import { Category, Params as Parameters_ } from './view.component';
import {
  Article,
  Keywords,
  Meta,
  Payload,
} from '@engineers/ngx-content-view-mat';
import {
  slug as _slug,
  html2text,
  length,
} from '@engineers/ngx-content-core/pipes-functions';
import { replaceAll } from '@engineers/javascript/string';

/**
 *
 * @param value
 * @param options
 */
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

/**
 *
 * @param url
 */
export function getParams(url: string): Parameters_ {
  let [link, query] = url.split('?');
  let type, item, category;
  if (link === '/') {
    type = 'articles';
  }

  // example: articles or articles/
  let typeMatch = link.match(/^\/([^/]+\/?)$/);
  if (typeMatch) {
    return { type: typeMatch[1] };
  }

  // example: articles/category.slug/item.slug~item.id
  let itemMatch = link.match(/^\/(.+)\/(.+)\/.+~(.+)$/);
  if (itemMatch) {
    return {
      type: itemMatch[1],
      category: { slug: itemMatch[2] },
      item: itemMatch[3],
    };
  }

  // example: articles/~item.id
  let itemShortMach = link.match(/^\/([^/]+)\/~(.+)$/);
  if (itemShortMach) {
    return { type: itemShortMach[1], item: itemShortMach[2] };
  }

  // example: articles/category.slug
  let categoryMatch = link.match(/^\/(.+)\/([^~][^/]+)$/);
  if (categoryMatch) {
    return { type: categoryMatch[1], category: { slug: categoryMatch[2] } };
  }

  return { type: 'articles' };
}

export interface GetUrlOptions {
  limit?: number;
  offset?: number;
}
/**
 *
 * @param parameters
 * @param options
 */
export function getUrl(parameters: any, options: GetUrlOptions = {}): string {
  let url = `${parameters.type}/`;
  if (parameters.item) {
    // todo: ~_id,title,subtitle,summary,author,cover,categories,updatedAt
    url += parameters.item;
  } else {
    url += `${options.offset || 0}:${options.limit || 10}@status=approved`;
    if (parameters.category._id) {
      // get articles where category in article.categories[]
      url += `,categories=${parameters.category._id}`;
    } else if (parameters.category.slug) {
      // get articles in a category by its slug name
      url += `,category=${encodeURIComponent('^' + parameters.category.slug)}`;
    }
    // sort by createdAt or updatedAt (descending)
    url += `%3Fsort=createdAt:-1`;
  }

  if (parameters.refresh) {
    url += `?refresh=${parameters.refresh}`;
  }
  return url;
}

/**
 *
 * @param data
 * @param parameters
 * @param categories
 */
export function transformData(
  data: Payload,
  parameters: Parameters_,
  categories?: Category[]
): Payload {
  if (!data) {
    throw new Error('[transformData] no data');
  }

  if (typeof data === 'string') {
    // for example: when the url fetched via a ServiceWorker
    data = JSON.parse(data);
  }

  let dataTransformed: Payload;

  if (Array.isArray(data)) {
    dataTransformed = data
      .map((item: Article) =>
        adjustArticle(item, parameters, categories, 'list')
      )
      // randomize (shuffle) data[]
      .sort(() => 0.5 - Math.random());
  } else if (data.content) {
    // data may not contain 'content' property
    // for example article_categories
    dataTransformed = adjustArticle(data, parameters, categories, 'item');
  } else {
    dataTransformed = data;
  }

  return dataTransformed;
}

/**
 *
 * @param data
 * @param parameters
 * @param defaultMetaTags
 */
export function getMetaTags(
  data: Payload,
  parameters: Parameters_,
  // override tags from `data`
  defaultMetaTags: Meta = {}
): Meta {
  if (!data) {
    return defaultMetaTags;
  }
  let metaTags: Meta;

  if (!Array.isArray(data)) {
    // prevent data from mutating
    let _data = Object.assign({}, data);
    if (_data.keywords && defaultMetaTags.baseUrl) {
      _data.keywords = adjustKeywords(_data.keywords, defaultMetaTags);
    }

    metaTags = {
      ...defaultMetaTags,
      // todo: change data.link to data.url
      url: _data.link,
      title: _data.title,
      author: _data?.author?.name,
      description: _data.content
        ? summary(_data.content, { lineBreak: '\n', length: 500 })
        : _data.title,
      image: _data?.cover || defaultMetaTags?.image,
      // todo: pass twitter:creator, twitter:creator:id
      // todo: expires
    };

    // use data.image to override data.cover.src
    // data.cover.src may be just a placeholder
    // see adjustArticle()
    if (_data.image) {
      metaTags.image.src = _data.image;
    }
  }
  // todo: category link, title
  else {
    metaTags = {
      ...defaultMetaTags,
      url: defaultMetaTags.url + parameters.type,
      title: defaultMetaTags.name,
    };
  }

  // todo: if(jobs)description=..
  if (!('cover' in metaTags) && parameters.type === 'jobs') {
    metaTags.image = {
      src: '/assets/site-image/jobs.webp',
      // todo: width, height
    };
  }

  return metaTags;
}

/**
 *
 * @param item
 * @param parameters
 * @param categories
 * @param type
 */
export function adjustArticle(
  item: Article,
  parameters: Parameters_,
  categories?: Array<Category>,
  type: 'item' | 'list' = 'item'
): Article {
  // todo: param.category || item.categories[0] || config.general
  let category;
  if (
    item.categories &&
    item.categories.length > 0 &&
    Array.isArray(categories)
  ) {
    category = categories.find((element) => element._id === item.categories[0]);
  }

  let adjustedItem = Object.assign(
    {
      id: item._id,
      summary: item.content ? summary(item.content) : item.title,
      slug: `${
        category ? category.slug || slug(category.title!) : 'general'
      }/${slug(item.title || '')}`,

      link: `/${parameters.type}/${item.slug}~${item._id}`,
    },
    item
  );

  if (adjustedItem.cover) {
    // if the layout changed, change the attribute sizes, for example if a side menu added.
    // todo: i<originalSize/250
    let src = `/api/v1/image/${parameters.type}-cover-${adjustedItem.id}/${adjustedItem.slug}.webp`,
      srcset = '',
      // for type=item: image width = 100% of the viewport width
      // for type=list: each column is adjusted to be ~250px (by css media queries)
      // or: 1000->25vw (4 cols), 750->33vw (3cols), 500->50vw (2cols), default=100vw
      sizes = type === 'item' ? '100vw' : '250px';
    for (let index = 1; index < 10; index++) {
      let n = index * 250;
      srcset += `${src}?size=${n} ${n}w, `;
    }

    adjustedItem.cover = {
      src: '//via.placeholder.com/1000x500/.webp?text=loading...',
      // use cover.src to set og:image meta tag
      // after setting meta tags, replace cover.src with cover.placeholder then delete cover.placeholder
      // because <ngx-content-viw-mat> doesn't use cover.placeholder
      srcset,
      sizes,
    };

    // a temporary property for 'ogg:image' meta tag
    // to override the placeholder adjustedItem.cover.src
    adjustedItem.image = src;
  }

  if (type === 'item' && parameters.type === 'jobs') {
    adjustedItem.content += `<div id='contacts'>${adjustedItem.contacts}</div>`;
  }

  if (type === 'list') {
    adjustedItem.content = adjustedItem.summary;
  }

  return adjustedItem;
}

/**
 *
 * @param keywords
 * @param defaultTags
 */
export function adjustKeywords(
  keywords: string | Keywords[],
  defaultTags: Meta
): Keywords[] {
  // error TS2352: Conversion of type 'string' to type 'Keywords[]' may be a mistake
  // because neither type sufficiently overlaps with the other.
  // If this was intentional, convert the expression to 'unknown' first.
  if (typeof keywords === 'string') {
    // @ts-ignore
    (keywords as Keywords[]) = keywords
      .split(',')
      .map((text: string) => ({ text }));
  }

  return (keywords as Keywords[])
    .filter((element: any) => element.text)
    .map((element: any) => {
      if (!element.link) {
        element.link = `https://www.google.com/search?q=site%3A${
          defaultTags.baseUrl
        }+${replaceAll(element.text, '', '+')}`;
      }

      element.target = '_blank';
      return element;
    });
}

/**
 *
 * @param value
 * @param options
 */
export function summary(value: string, options: any = {}): string {
  let text = html2text(value, { lineBreak: options.lineBreak || 'br' });
  // eslint-disable-next-line unicorn/explicit-length-check
  return length(text, options.length || 500);
}
