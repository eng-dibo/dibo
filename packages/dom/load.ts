/**
 * dynamically load and inject scripts
 * returns a promise, so dependencies can be loaded in order
 *
 * @param source the path or link to the file
 * @param attributes key-value attributes to be added to the html element
 * @param type one of 'script' | 'css' | 'link' | 'module'
 * @param parent the html element to inject the created element into
 * @returns {Promise<HTMLElement>} a promise that resolves to the created element
 */
export default function load(
  source: string,
  attributes: { [key: string]: any } = {},
  type?: 'script' | 'css' | 'link' | 'module',
  parent?: HTMLElement
): Promise<HTMLElement> {
  return new Promise((resolve, reject) => {
    if (!type) {
      let fileExtension = (source.split('.').pop() || '').toLowerCase();
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
      attributes.href = source;
      // https://developer.mozilla.org/en-US/docs/Web/HTML/Preloading_content#Cross-origin_fetches
      attributes.crossorigin = true;
    } else if (type === 'script' || type === 'module') {
      attributes.src = source;

      // `type = 'text/javascript'` is no more required
      attributes.type = type === 'module' ? type : 'text/javascript';
    }

    if (!('async' in attributes)) {
      attributes.async = true;
    }

    let element: HTMLElement = document.createElement(
      type === 'link' ? 'link' : 'script'
    );
    for (let key in attributes) {
      if (attributes.hasOwnProperty(key)) {
        element.setAttribute(key, attributes[key]);
      }
    }

    // todo: fix: non of the following events emits
    // todo: remove listener after resolving the Promise
    element.addEventListener('load', () => {
      console.log('load', source);
      resolve(element);
    });

    element.addEventListener('loaded', () => {
      console.log('loaded', source);
      resolve(element);
    });

    element.addEventListener('complete', () => {
      console.log('complete', source);
      resolve(element);
    });

    element.addEventListener('readystatechange', () => {
      console.log('el:readystatechange', source);
      resolve(element);
    });
    element.addEventListener('error', (error) => {
      console.log('el:error', { error, src: source });
      reject(error);
    });

    (parent || document.head || document.body).append(element);
  });
}
