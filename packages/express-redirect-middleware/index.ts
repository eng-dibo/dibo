import { ParseResultListed, fromUrl, parseDomain } from 'parse-domain';
import url from 'node:url';
import { NextFunction, Request, RequestHandler, Response } from 'express';

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
    request: any
  ) => void;
}

/**
 * redirects the request to the https version,
 * and adds www. to the naked domains
 *
 * @param options
 * @returns
 */
// todo: testing (use supertest)
export default function (options?: Options): RequestHandler {
  return (request: Request, response: Response, next: NextFunction) => {
    let parts: ParseResultListed = parseDomain(
      // fromUrl() gets the punycode of the domain,
      // use url.domainToUnicode() to convert it back to unicode
      // https://www.npmjs.com/package/parse-domain
      // https://nodejs.org/api/url.html#urldomaintounicodedomain
      // https://www.npmjs.com/package/punycode (deprecated)
      fromUrl(request.hostname)
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

      let newUrl = `${opts.protocol || request.protocol}://${subdomain}${
        parts.domain
      }.${(parts.topLevelDomains || []).join('.')}${request.originalUrl}`;

      let oldUrl = `${request.protocol}://${request.hostname}${request.originalUrl}`;

      // redirect only if the url has been changed to prevent circular redirects
      if (newUrl !== oldUrl) {
        if (opts.cb && typeof opts.cb === 'function') {
          opts.cb(oldUrl, newUrl, parts, request);
        }
        return response.redirect(301, newUrl);
      }
    }
    next();
  };
}
