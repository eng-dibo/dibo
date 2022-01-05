// todo: types
// todo tags.author{name, email, url}
/*
todo:
if (tags.keywords instanceof Array)
  tags.keywords = data.keywords.join(",");
if (!("last-modified" in tags) && tags.updatedAt) {
  tags["last-modified"] = tags.updatedAt;
  delete tags.updatedAt;
}
if(data.createdAt && ){...}
 */
import { Injectable } from '@angular/core';
// for SSR: https://github.com/angular/angular/issues/15742#issuecomment-292892856
import {
  Meta as MetaTagsService,
  MetaDefinition,
  Title as TitleService,
} from '@angular/platform-browser';
import { NgxLoadService } from './load-scripts.service';

export interface App {
  id?: string;
  name?: string;
  url?: string;
}

export interface Image {
  src?: string;
  alt?: string;
  width?: number | string;
  height?: number | string;
}
// todo: all meta tags https://gist.github.com/whitingx/3840905
// todo: apply best practices for meta tags
export interface Meta /* todo: extends MetaDefinition */ {
  image?: string | Image;
  // page title, todo: max lenth=200
  title?: string;
  // application name
  name?: string;
  // todo: html2text(), max length=500
  description?: string;
  baseUrl?: string;
  // canonical url
  url?: string;
  // type of the object you are sharing, examples: website, article, video, company
  type?: string;
  fb_app?: string;
  // the corresponding apps in app stores
  apps?: {
    iphone: App;
    googleplay: App;
    ipad: App;
  };
  twitter?: {
    // https://developer.twitter.com/en/docs/tweets/optimize-with-cards/overview/markup
    card?: string;
    site?: string;
    'site:id'?: string;
    creator?: string;
    'creator:id'?: string;
    description?: string;
    title?: string;
    image?: string;
    'image:alt'?: string;
    player?: string;
    'player:width'?: string;
    'player:height'?: string;
    'player:stream'?: string;
    'app:name:iphone'?: string;
    'app:id:iphone'?: string;
    'app:url:iphone'?: string;
    'app:name:googleplay'?: string;
    'app:id:googleplay'?: string;
    'app:url:googleplay'?: string;
    'app:name:ipad'?: string;
    'app:id:ipad'?: string;
    'app:url:ipad'?: string;
  };

  [key: string]: any;
}

@Injectable()
export class MetaService {
  constructor(
    private metaService: MetaTagsService,
    private titleService: TitleService,
    private loadService: NgxLoadService
  ) {}

  /**
   * prepares meta tags
   * - adds default tags for setTags (not updateTags)
   * - converts tags to the correct form like {key: value} -> {name: key, content: value}
   * @param tags
   * @returns the final tags
   */
  prepare(tags: Meta = {}): MetaDefinition[] {
    if (tags.baseUrl && tags.baseUrl.substr(-1) !== '/') {
      tags.baseUrl += '/';
    }

    if (tags.url) {
      if (tags.baseUrl && tags.url.startsWith('/')) {
        tags.url = tags.baseUrl + tags.url.slice(1);
      }
      tags['og:url'] = tags.url;

      // canonical is <link> not <meta>, so we don't use metaTags service here.
      this.loadService.load(tags.url, { rel: 'canonical' }, 'link');
    }

    if (tags.image) {
      if (typeof tags.image === 'string') {
        tags.image = { src: tags.image as string };
      }
      if (tags.image.src && tags.image.src.startsWith('/')) {
        (tags.image as Image).src = tags.baseUrl + tags.image.src.slice(1);
      }

      tags['og:image'] = tags.image.src;
      if (tags.image.width) {
        tags['og:image:width'] = tags.image.width;
      }

      if (tags.image.height) {
        tags['og:image:height'] = tags.image.height;
      }

      // add <link> tag
      this.loadService.load(
        (tags.image as Image).src as string,
        {
          rel: 'image_src',
        },
        'link'
      );
    }

    if (tags.name && tags.title && tags.title !== tags.name) {
      tags.title += ' | ' + tags.name;
    }

    if (tags.title) {
      this.titleService.setTitle(tags.title || '');
      tags['og:title'] = tags.title;
    }

    if (tags.name) {
      tags['og:site_name'] = tags.name;
      tags['application-name'] = tags.name;
    }

    if (tags.description) {
      tags['og:description'] = tags.description;
    }

    if (tags.fb_app) {
      tags['fb:app_id'] = tags.fb_app;
    }

    if (tags.twitter) {
      let defaultTwitterTags = {
        card: 'summary_large_image',
        title: tags.title,
        image: tags.image ? (tags.image as Image).src : null,
        description: tags.description,
        creator: tags.author,
      };

      if (tags.apps) {
        for (let k in tags.apps) {
          if (tags.apps.hasOwnProperty(k)) {
            for (let kk in tags.app[k]) {
              if (tags.app[k].hasOwnProperty(kk)) {
                defaultTwitterTags[
                  `${kk}:${k}` as keyof typeof defaultTwitterTags
                ] = tags.app[k][kk];
              }
            }
          }
        }
      }

      tags.twitter = Object.assign(defaultTwitterTags, tags.twitter || {});

      for (let key in tags.twitter) {
        // use `keyof typeof tags.twitter` as value type to fix:
        // Element implicitly has an 'any' type because expression of type 'string' can't be used to index type {...}
        // https://stackoverflow.com/a/57088282/12577650
        // https://stackoverflow.com/a/60274490/12577650
        // https://stackoverflow.com/a/64217699/12577650
        // let value: keyof typeof tags.twitter = tags.twitter[key];
        // or add index signature to tags.twitter (i.e: {[key: string]: any})
        if (tags.twitter.hasOwnProperty(key)) {
          let value: string | undefined =
            tags.twitter[key as keyof typeof tags.twitter];
          if (!value) {
            continue;
          }
          if (key.slice(0, 8) === 'twitter:') {
            key = key.slice(8);
          }
          if (key === 'site' || key === 'site:id') {
            if (!(value as string).startsWith('@')) {
              value = '@' + value;
            }
          } else if (key === 'description') {
            value = (value as string).slice(0, 200);
          }
          tags[`twitter:${key}`] = value;
        }
      }
    }
    delete tags.url;
    delete tags.image;
    delete tags.fb_app;
    delete tags.baseUrl;
    delete tags.twitter;
    delete tags.name;

    // set meta tags, remove null values
    // tags.map((tag: any) => this.prepare(tag));
    let _tags: MetaDefinition[] = [];
    for (let key in tags) {
      if (tags.hasOwnProperty(key)) {
        _tags.push(this.convert(key, tags[key]));
      }
    }
    return _tags;

    // todo: icon, refresh:url | [url,time],
  }

  /**
   * sets meta tags of the page
   * @param tags
   * @returns an array of the final meta tags
   */
  // todo: <meta name> VS <meta property>
  addTags(tags: Meta = {}): HTMLMetaElement[] {
    let defaultTags = {
      viewport: 'width=device-width, initial-scale=1',
      type: 'website',
      charset: 'UTF-8',
      'content-type': 'text/html',
      baseUrl: '/',
      title: tags.name,
      'og:type': 'website',
      medium: 'website',
    };

    let _tags: MetaDefinition[] = this.prepare(
      Object.assign(defaultTags, tags)
    );

    return this.metaService.addTags(_tags, false);
  }

  /**
   * updates the existing tags and returns the final transformed meta tags
   * @param tags
   * @returns
   */

  updateTags(tags: Meta = {}): HTMLMetaElement[] {
    // todo: retrieve all existing tags and prepare(allTags) then updateTags(tags) and return allTags
    tags = this.prepare(tags);
    console.log({ tags });

    let result: HTMLMetaElement[] = [];
    tags.forEach((tag: MetaDefinition) => {
      if (tag.name && tag.name === 'url') {
        // already handled by this.prepare()
        return;
      }

      let el = this.metaService.updateTag(tag);
      if (el) {
        result.push(el);
      }
    });

    return result;
  }

  /**
   * get the first instance of the matching meta tag.
   * @param selector
   * @returns
   */
  getTag(selector: any): HTMLMetaElement | null {
    return this.metaService.getTag(selector);
  }

  /**
   * returns all tags that matches the given selector as an array of HTMLElements
   * i.e `<meta ... />` not `{key: value}`
   * @param selector
   * @returns
   */
  getTags(selector: any): HTMLMetaElement[] {
    return this.metaService.getTags(selector);
  }

  /**
   * converts {key: value} to {name: key, content: value}
   * @method convert
   * @param  key
   * @param  value
   * @return
   */
  convert(key: string, value: any): { [key: string]: any; content?: any } {
    let prop: string;

    if (['charset'].includes(key)) {
      // <meta charset="UTF-8"> not <meta name="charset" content="UTF-8">
      return { [key]: value };
    }

    if (key.substr(0, 3) === 'og:') {
      prop = 'property';
    } else if (key === 'http-equiv' || key === 'httpEquiv') {
      prop = 'httpEquiv';
      [key, value] = value; // ex: {httpEquiv:['content','text/html']}
    } else if (
      [
        'date',
        'last-modified',
        'expires',
        'location',
        'refresh',
        'content-type',
        'content-language',
        'cache-control',
      ].includes(key)
    ) {
      // http://help.dottoro.com/lhquobhe.php
      // ex: <meta http-equiv=”last-modified” content=”YYYY-MM-DD”>
      prop = 'httpEquiv';

      if (key === 'location') {
        value = value.slice(0, 4) !== 'URL=' ? 'URL=' + value : value;
      } else if (key === 'refresh') {
        value =
          value instanceof Array ? `${value[0]}; URL='${value[1]}'` : value;
      }
    } else {
      prop = 'name';
    }

    // todo: itemprop i.e: <meta name> VS <meta itemprop>
    return { [prop]: key, content: value };
  }
}
