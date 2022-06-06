/**
 * functions to transform the content.
 * examples:
 * - convert the content format from html code into plain text with html2text()
 * - convert line breaks with nl2br()
 * - limit the length of  the content with length()
 * - create a url-friendly slug from the content title
 */

import {
  DomSanitizer,
  SafeHtml,
  ɵDomSanitizerImpl,
} from '@angular/platform-browser';
import { replaceRec } from '@engineers/javascript/string';

/**
 * cuts a part of a string into the specified length, starting from `start` value
 *
 * @param value
 * @param _length
 * @param start
 * @returns
 */
export function length(value: string, _length?: number, start = 0): string {
  return _length && value ? value.slice(start, _length + start) : value;
}

/**
 * converts line breaks `\n\r` into `<br />`
 *
 * @param value
 * @returns
 */
export function nl2br(value: string): string {
  return value.replace(/\r\n|\n\r|\r|\n/g, '<br />');
}

export interface SlugOptions {
  // the maximum output length of the slug, default: 200.
  length?: number;
  // a regexp of allowed characters and language codes, separated by '|'.
  allowedChars?: string;
  encode?: boolean;
}
/**
 * creates a url-friendly slug from a text (a content title)
 * i.e: replaces the white spaces, removes the unwanted characters
 * and limits the slug to the specified length
 *
 * @function slug
 * @param  value the text to be converted into slug.
 * @param options
 * @returns
 */
export function slug(value: string, options: SlugOptions = {}): string {
  let langs = {
    ar: 'أابتثجحخدذرزسشصضطظعغفقكلمنهويىآئءلألإإآة',
  };

  let options_ = Object.assign(
    {
      length: 200,
      allowedChars: '',
      encode: true,
    },
    options || {}
  );

  options_.allowedChars = options_.allowedChars
    .split('|')
    .map((element) =>
      element.startsWith(':')
        ? langs[element.slice(1) as keyof typeof langs]
        : element
    )
    .join('');

  let _slug = value
    // remove the trailing spaces
    .trim()
    // remove any unallowed characters
    .replace(new RegExp(`[^a-z0-9-._~${options_.allowedChars}]`, 'gi'), '-')
    // replace the inner spaces with '-'
    .replace(/\s+/g, '-')
    // remove sequential slashes
    .replace(/-{2,}/g, '-')
    // remove the trailing slashes at the beginning or the end.
    .replace(/^-+|-+$/g, '');

  return length(
    options_.encode ? encodeURIComponent(_slug) : _slug,
    options_.length
  );
}

export interface Html2textOptions {
  // whether to use <br /> or '\n' line breaks
  // use '\n' to save the text into a file, and use '<br />' to display the text in a web page.
  // also all block tags like <p>, <h1> will be converted into the specified line break format
  lineBreak?: 'br' | 'n';
  // string: link format replacement, use [text] and [href] or $1 and $2.
  // example: to convert links into md format : '[[text]]([href])'
  // it should be the same as the second parameter of String.replace(), in addition to [text] and [href].
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/replace#specifying_a_function_as_a_parameter
  links?: string | (() => string);
}

/**
 * converts an html code into a plain text, keeping some allowed tags, or converts it into another format
 * for example: you can keep links <a> or convert it into `md` format (i.e: [text](link))
 *
 * @param value
 * @param options
 * @returns
 */
// todo: use a transformer function to convert html nodes into another format
// todo: filter(el=>(boolean=false))
// todo: use htmlTransform(value, transform(match)=>newValue)
// example  html2text= htmlTransform(value, (match)=>{if(match[1]==='h1')return '<h2>$2</h2>'})
export function html2text(
  value: string,
  options: Html2textOptions = {}
): string {
  let options_ = Object.assign(
    { lineBreak: 'n', links: '$2 $1' },
    options || {}
  );

  if (typeof options_.links === 'string') {
    options_.links = options_.links
      .replace('[text]', '$2')
      .replace('[href]', '$1');
  }

  // convert line breaks and block tags like <p> and <h1> into the specified format
  // todo: get all html block tags
  // pattern: /<p .*>(content)</.+>/
  let blockTags = /(?:<(?:p|h[1-6])+>(.*?)<\/.+?>)+?/gi;

  value =
    options_.lineBreak === 'br'
      ? // we need only <p> or <p .*>, but not <pxxx>
        nl2br(value).replace(blockTags, '<br />$1<br />')
      : value.replace(/<br.*>/gi, '\n').replace(blockTags, '\n$1\n');

  // convert links into the specified format
  value = value.replace(
    /<a.*? href=["'](.*?)["'].*>(.*?)<\/a>/gi,
    options_.links
  );

  value = value
    // remove inline <style>, <script>, <meta> blocks
    .replace(/<(style|script|meta)[^>]*>.*<\/\1>/g, '')
    // strip html(except <br> if lineBreak=br)
    // or: /<(?:.|\s)*?>/
    .replace(options_.lineBreak === 'br' ? /<(?!br)[^>]+>/g : /<[^>]+>/g, '')
    // remove leading spaces and repeating CR/LF
    .replace(/([\n\r]+ +)+/g, '');

  // remove repeating line breaks
  // matches `<br>  <br>` and `<br>\n</br>
  value = replaceRec(value, /(<br[^>]*>[\n ]?)+/g, '<br />');
  return value;
}

/**
 * hypernate links
 *
 * @param value
 */
// todo: implement this function
export function hypernate(value: string): string {
  // starts with a protocol like http://
  // or ends with a known tdl like .com, .com.eg and an optional country code.
  // or an ip address
  // doesn't include spaces or unallowed characters.
  // doesn't exist inside <a> tag, i.e only plain text links.

  // todo: add all unallowedUrlChars, tdl, ...
  let unallowedUrlChars = ` "'\`\n<>[\\]`;
  let tdl = 'com|net|org';

  let textLinkPattern = new RegExp(
    // todo: doesn't exist inside <a> -> negative lookahead
    // starts with a protocol
    `((?:(?:ftp|http)s?)+:\/\/[^ ${unallowedUrlChars}]+` +
      // ends with a known tdl and an optional country code
      // examples: domain.com, domain.com.eg
      `|[^ ${unallowedUrlChars}\\/]+\\.(?:${tdl})(?:\.[a-z]{2}){0,1})` +
      // optional port number
      // example: https://host:port/
      `(?::\d+)?` +
      // optional path
      `(?:\/[^ ${unallowedUrlChars}]+)*` +
      // doesn't followed by '*</a>', i.e: doesn't exist inside <a> tag (plain links only)
      // https://stackoverflow.com/a/68188492/12577650
      `(?![^<]*<\/a>)`,
    'gi'
  );
  return value.replace(
    textLinkPattern,
    (match) => `<a href="${match}">${match}</a>`
  );
  //;
}

/**
 * bypasses Angular sanitizer and prevents Angular from sanitizing the html value,
 * https://angular.io/guide/security#xss
 * don't do: <p>{{content | keepHtml}}</p> -> error: SafeValue must use [property]=binding
 * do: <p [innerHTML]='content | keepHtml'></p>
 * https://stackoverflow.com/a/58618481
 * https://medium.com/@AAlakkad/angular-2-display-html-without-sanitizing-filtering-17499024b079
 *
 * @function keepHtml
 * @param  value  the trusted value to be bypassed
 * @param  sanitizer the injected DomSanitizer
 * @returns SafeHTML, the bypassed html value.
 * @example <div [innerHTML]="htmlContent | keepContent"></div>
 */
export function keepHtml(value: string, sanitizer?: any): SafeHtml {
  // todo: pass sanitizer or document
  if (!sanitizer) {
    sanitizer = new ɵDomSanitizerImpl(document);
  }
  return sanitizer.bypassSecurityTrustHtml(value);
}
