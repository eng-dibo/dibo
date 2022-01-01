/**
 * dynamically load and inject scripts
 * returns a promise, so dependencies can be loaded in order
 * @param src
 * @param attributes
 * @param type
 * @param parent
 * @returns
 */
export default function load(
  src: string,
  attributes: { [key: string]: any } = {},
  type?: 'script' | 'css' | 'link' | 'module',
  parent?: HTMLElement
): Promise<HTMLElement> {
  return new Promise((resolve, reject) => {
    if (!type) {
      let fileExtension = (src.split('.').pop() || '').toLowerCase();
      if (fileExtension === 'js') {
        type = 'script';
      }
      // style sheet
      else if (['css', 'scss', 'less', 'sass'].includes(fileExtension)) {
        type = 'css';
      }
      // web fonts
      else if (['EOT', 'TTF', 'WOFF', 'WOFF2'].includes(fileExtension)) {
        type = 'link';
      } else {
        type = 'link';
      }
    }

    if (type === 'css') {
      type = 'link';
      attributes.rel = 'stylesheet';
      attributes.type = 'text/css';
    }

    if (type === 'link') {
      attributes.href = src;
      // https://developer.mozilla.org/en-US/docs/Web/HTML/Preloading_content#Cross-origin_fetches
      attributes.crossorigin = true;
    } else if (type === 'script' || type === 'module') {
      attributes.src = src;
      if (type === 'module') {
        attributes.type = type;
      }
      // `type = 'text/javascript'` is no more required
      else {
        attributes.type = 'text/javascript';
      }
    }

    if (!('async' in attributes)) {
      attributes.async = true;
    }

    let el: HTMLElement = document.createElement(
      type === 'link' ? 'link' : 'script'
    );
    for (let key in attributes) {
      if (attributes.hasOwnProperty(key)) {
        el.setAttribute(key, attributes[key]);
      }
    }

    // todo: fix: non of the following events emits
    // todo: remove listener
    el.addEventListener('load', () => {
      console.log('load', src);
      resolve(el);
    });

    el.addEventListener('loaded', () => {
      console.log('loaded', src);
      resolve(el);
    });

    el.addEventListener('complete', () => {
      console.log('complete', src);
      resolve(el);
    });

    el.addEventListener('readystatechange', () => {
      console.log('el:readystatechange', src);
      resolve(el);
    });
    el.addEventListener('error', (error) => {
      console.log('el:error', { error, src });
      reject(error);
    });

    (parent || document.head || document.body).appendChild(el);
  });
}
