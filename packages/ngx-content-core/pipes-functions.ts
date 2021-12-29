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
  ɵDomSanitizerImpl,
  SafeHtml,
} from '@angular/platform-browser';
import { replaceRec } from '@engineers/javascript/string';

/**
 * cuts a part of a string into the specified length, starting from `start` value
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
 * @method slug
 * @param  value the text to be converted into slug.
 * @param options
 * @return
 */
export function slug(value: string, options: SlugOptions = {}): string {
  let langs = {
    ar: 'أابتثجحخدذرزسشصضطظعغفقكلمنهويىآئءلألإإآة',
  };

  let opts = Object.assign(
    {
      length: 200,
      allowedChars: '',
      encode: true,
    },
    options || {}
  );

  opts.allowedChars = opts.allowedChars
    .split('|')
    .map((el) =>
      el.startsWith(':') ? langs[el.substr(1) as keyof typeof langs] : el
    )
    .join('');

  let _slug = value
    // remove the trailing spaces
    .trim()
    // remove any unallowed characters
    .replace(new RegExp(`[^a-z0-9-._~${opts.allowedChars}]`, 'gi'), '-')
    // replace the inner spaces with '-'
    .replace(/\s+/g, '-')
    // remove sequential slashes
    .replace(/-{2,}/g, '-')
    // remove the trailing slashes at the beginning or the end.
    .replace(/^-+|-+$/g, '');

  return length(opts.encode ? encodeURIComponent(_slug) : _slug, opts.length);
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
  let opts = Object.assign({ lineBreak: 'n', links: '$2 $1' }, options || {});

  if (typeof opts.links === 'string') {
    opts.links = opts.links.replace('[text]', '$2').replace('[href]', '$1');
  }

  // convert line breaks and block tags like <p> and <h1> into the specified format
  // todo: get all html block tags
  // pattern: /<p .*>(content)</.+>/
  let blockTags = /(?:<(?:p|h[1-6])+?>(.*?)<\/.+?>)+?/gi;

  value =
    opts.lineBreak === 'br'
      ? // we need only <p> or <p .*>, but not <pxxx>
        nl2br(value).replace(blockTags, '<br />$1<br />')
      : value.replace(/<br.*>/gi, '\n').replace(blockTags, '\n$1\n');

  // convert links into the specified format
  value = value.replace(
    /<a.*? href=(?:"|')(.*?)(?:"|').*>(.*?)<\/a>/gi,
    opts.links
  );

  value = value
    // remove inline <style>, <script>, <meta> blocks
    .replace(/<(style|script|meta)[^>]*>.*<\/\1>/gm, '')
    // strip html(except <br> if lineBreak=br)
    // or: /<(?:.|\s)*?>/
    .replace(opts.lineBreak === 'br' ? /<(?!br)[^>]+>/g : /<[^>]+>/g, '')
    // remove leading spaces and repeating CR/LF
    .replace(/([\r\n]+ +)+/gm, '');

  // remove repeating line breaks
  // matches `<br>  <br>` and `<br>\n</br>
  value = replaceRec(value, /(<br[^>]*?>[ \n]?)+/gm, '<br />');
  return value;
}

/**
 * hypernate links
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
 * @method keepHtml
 * @param  value  the trusted value to be bypassed
 * @param  sanitizer the injected DomSanitizer
 * @return SafeHTML, the bypassed html value.
 * @example <div [innerHTML]="htmlContent | keepContent"></div>
 */
export function keepHtml(value: string, sanitizer?: any): SafeHtml {
  // todo: pass sanitizer or document
  if (!sanitizer) {
    sanitizer = new ɵDomSanitizerImpl(document);
  }
  return sanitizer.bypassSecurityTrustHtml(value);
}
