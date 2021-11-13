import { Params } from './view.component';
import {
  Article,
  Payload,
  Keywords,
  Meta,
} from '@engineers/ngx-content-view-mat';
import { html2text, length } from '@engineers/ngx-content-core/pipes-functions';
import { slug } from '@engineers/ngx-content-core';
import { metaTags as _defaultMetaTags } from '~config/browser';
import { replaceAll } from '@engineers/javascript/string';

export function getParams(params: any, query: any): Params {
  let type = params.get('type') || 'articles',
    category = params.get('category'),
    // item may be: id or slug-text=id
    item = params.get('item');

  if (!category && item && item.indexOf('~') === -1) {
    category = item;
    item = null;
  }

  return {
    type,
    category,
    // get last part of a string https://stackoverflow.com/a/6165387/12577650
    // using '=' (i.e /slug=id) will redirect to /slug
    id: item && item.indexOf('~') !== -1 ? item.split('~').pop() : item,
    refresh: query.get('refresh'),
  };
}

export function getUrl(params: Params): string {
  let url: string;
  if (params.category) {
    url = `${params.type}_categories/${params.category}`;
  } else {
    // todo: ~_id,title,subtitle,slug,summary,author,cover,categories,updatedAt
    let filter = encodeURIComponent(JSON.stringify({ status: 'approved' }));
    url = `${params.type}/${params.id ? params.id : ':50@' + filter}`;
  }

  return url;
}

export function transformData(data: Payload, params: Params): Payload {
  if (typeof data === 'string') {
    // ex: the url fetched via a ServiceWorker
    data = JSON.parse(data);
  }

  if (data instanceof Array) {
    data = data.map((item: Article) =>
      adjustArticle(item, params)
    ) as Article[];
  } else if (!data.error && data.content) {
    // data may be doesn't 'content' property
    // for example article_categories
    data = adjustArticle(data as Article, params);
  }

  return data;
}

export function getMetaTags(data: Payload, params: Params): Meta {
  let metaTags;
  if (!(data instanceof Array)) {
    let defaultTags = defaultMetaTags(params.type);

    if (data.keywords && defaultTags.baseUrl) {
      data.keywords = adjustKeywords(data.keywords, defaultTags);
    }

    metaTags = {
      ...defaultTags,
      ...data,
      author: data?.author?.name,
      // todo: | data.summary
      description: data?.content,
      image: data?.cover || defaultTags?.image,
      // todo: pass twitter:creator, twitter:creator:id
      // todo: expires
    };
  }
  // todo: page link, title
  else {
    metaTags = defaultMetaTags(params.type);
  }
  /*
     todo:
     delete tags.id;
     delete tags.slug;
     delete tags.cover;
     delete tags.content;
     delete tags.summary;
     delete tags.sources; //todo: display resources
     delete tags.path; //todo: display path, ex: news/politics
     //delete tags.createdAt;
     //delete tags.updatedAt; -> last-modified
      */

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
  item.summary = item.summary || summary(item.content);
  if (!item.slug || item.slug === '') {
    item.slug = slug(item.title);
  }
  if (item.cover) {
    // if the layout changed, change the attribute sizes, for example if a side menue added.
    // todo: i<originalSize/250
    let src = `/api/v1/image/${params.type}-cover-${item._id}/${item.slug}.webp`,
      srcset = '',
      sizes =
        '(max-width: 1000px) 334px, (max-width: 800px) 400px,(max-width: 550px) 550px';
    for (let i = 1; i < 10; i++) {
      srcset += `${src}?size=${i * 250} ${i * 250}w, `;
    }

    item.cover = {
      src,
      srcset,
      sizes,
      alt: item.title,
      lazy: true,
      // use same colors as website theme (i.e: toolbar backgroundColor & textColor)
      // don't use dynamic size i.e: placeholder.com/OriginalWidthXOriginalHeight, because this image will be cashed via ngsw
      // todo: width:originalSize.width, height:..
      placeholder:
        '//via.placeholder.com/500x250.webp/1976d2/FFFFFF?text=loading...',
    };
  }

  // todo: /$type/item.$categories[0].title/$item.slug~id
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
  delete item.type; // todo: remove from database
  //  delete item.keywords;
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

export function summary(value: string): string {
  let text = html2text(value, { lineBreak: 'br' });
  return length(text, 500);
}

// todo: defaultMetaTags(): Tags{}
export function defaultMetaTags(
  type: string = 'articles'
): typeof _defaultMetaTags {
  _defaultMetaTags.link += type;
  return _defaultMetaTags;
}
