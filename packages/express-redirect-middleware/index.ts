import { parseDomain, ParseResultListed } from 'parse-domain';

export interface Options {
  // force a specified protocol
  protocol?: 'http' | 'https';
  // add a subdomain if the domain doesn't have one
  subdomain?: string;
}

/**
 * redirects the request to the https version,
 * and adds www. to the naked domains
 * @param options
 * @returns
 */
export default function (options?: Options): any {
  return (req: any, res: any, next: any) => {
    let parts: ParseResultListed = parseDomain(
      // or req.get('host')
      req.hostname
    ) as ParseResultListed;
    // ex: www.example.com.eg ->{subDomains:[www], domain:google, topLevelDomains:[com]};
    // old(v2.3.4):{domain:example, subdomain:www, tld:.com.eg}
    // if the url cannot parsed (ex: localhost), parts= null, so we just skip to the next() middliware

    if (parts && !['localhost', '127.0.0.1'].includes(parts.hostname)) {
      let defaultOptions = {
        protocol: 'https',
        subdomain: 'www',
      };

      let opts = Object.assign(defaultOptions, options || {});

      // add a subdomain
      if (!parts.subDomains || parts.subDomains === []) {
        parts.subDomains = [opts.subdomain];
      }

      let url = `${opts.protocol}://${parts.subDomains.join('.')}.${
        parts.domain
      }.${(parts.topLevelDomains || []).join('.')}${req.originalUrl}`;

      // redirect only if the url has been changed to prevent circular redirects
      if (url !== `${req.protocol}://${req.hostname}${req.originalUrl}`) {
        return res.redirect(301, url);
      }
    }
    next();
  };
}
