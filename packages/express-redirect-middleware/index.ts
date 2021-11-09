import { fromUrl, parseDomain, ParseResultListed } from 'parse-domain';
import url from 'url';

export interface Options {
  // force a specified protocol, if !protocol: keep the original protocol
  protocol?: 'http' | 'https';
  // add a subdomain if the domain doesn't have one
  subdomain?: string;
  // a function that called if the url changed and being redirected
  cb?: (
    oldUrl: string,
    newUrl: string,
    parts: ParseResultListed,
    req: any
  ) => void;
}

/**
 * redirects the request to the https version,
 * and adds www. to the naked domains
 * @param options
 * @returns
 */
// todo: testing (use supertest)
export default function (options?: Options): any {
  return (req: any, res: any, next: any) => {
    let parts: ParseResultListed = parseDomain(
      // fromUrl() gets the punycode of the domain,
      // use url.domainToUnicode() to convert it back to unicode
      // https://www.npmjs.com/package/parse-domain
      // https://nodejs.org/api/url.html#urldomaintounicodedomain
      // https://www.npmjs.com/package/punycode (deprecated)
      fromUrl(req.hostname)
    ) as ParseResultListed;
    // ex: www.example.com.eg ->{subDomains:[www], domain:google, topLevelDomains:[com]};
    // if the url cannot parsed (ex: localhost), parts= null, so we just skip to the next() middleware
    // @ts-ignore
    parts.domain = url.domainToUnicode(parts.domain);

    if (parts && !['localhost', '127.0.0.1'].includes(parts.hostname)) {
      let opts = options || {};

      // if no subdomain, add opts.subdomain
      if (opts.subdomain && (!parts.subDomains || parts.subDomains === [])) {
        parts.subDomains = [opts.subdomain];
      }

      let subdomain =
        parts.subDomains.length > 0 ? parts.subDomains.join('.') + '.' : '';

      let newUrl = `${opts.protocol || req.protocol}://${subdomain}${
        parts.domain
      }.${(parts.topLevelDomains || []).join('.')}${req.originalUrl}`;

      let oldUrl = `${req.protocol}://${req.hostname}${req.originalUrl}`;

      // redirect only if the url has been changed to prevent circular redirects
      if (newUrl !== oldUrl) {
        if (opts.cb && typeof opts.cb === 'function') {
          opts.cb(oldUrl, newUrl, parts, req);
        }
        return res.redirect(301, newUrl);
      }
    }
    next();
  };
}
