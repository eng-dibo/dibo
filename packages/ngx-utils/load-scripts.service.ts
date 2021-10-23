import { Injectable, Inject, Renderer2, RendererFactory2 } from '@angular/core';
import { DOCUMENT } from '@angular/common';

@Injectable()
export class NgxLoadService {
  private renderer: Renderer2;

  constructor(
    @Inject(DOCUMENT) private document: Document,
    private rendererFactory: RendererFactory2
  ) {
    // we cannot use Rendere2 directly in services, use RendererFactory2 to create it.
    // instead of constructor(private renderer: Renderer2){}
    // https://stackoverflow.com/a/47924814/12577650
    this.renderer = this.rendererFactory.createRenderer(null, null);
  }
  /**
   * dynamically inject and load scripts
   * and returns a promise, so dependencies can be loaded in order
   * @param src
   * @param type
   * @param attributes
   * @param cb
   * @param parent
   * @return promise<HTMLElement>
   * @example load adsense
   * ngxLoadService.load('//pagead2.googlesyndication.com/pagead/js/adsbygoogle.js',{id: 'ca-pub-9687007734660221'})
   */
  load(
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

      // use Renderer2 (through RendererFactory in services) instead of document.createElement()
      // https://stackoverflow.com/a/59789482/12577650
      // https://stackoverflow.com/a/47924814/12577650
      // https://www.coditty.com/code/angular-component-dynamically-load-external-javascript
      // https://www.positronx.io/using-renderer2-angular/
      // https://www.tektutorialshub.com/angular/renderer2-angular/
      // let el: HTMLElement = this.document.createElement(type === 'link' ? 'link' : 'script');
      let el: HTMLElement = this.renderer.createElement(
        type === 'link' ? 'link' : 'script'
      );
      for (let key in attributes) {
        if (attributes.hasOwnProperty(key)) {
          this.renderer.setAttribute(el, key, attributes[key]);
        }
      }

      // todo: fix: non of the following events emits
      // todo: remove listener
      // equivalent to el.addEventListener()
      let listener = this.renderer.listen(el, 'load', () => {
        console.log('load');
        resolve(el);
      });

      this.renderer.listen(el, 'loaded', () => {
        console.log('loaded');
        resolve(el);
      });
      this.renderer.listen(el, 'complete', () => {
        console.log('complete');
        resolve(el);
      });

      this.renderer.listen(el, 'error', (err: any) => {
        console.log({ err });
        reject(err);
      });

      this.renderer.appendChild(parent || this.document.head, el);

      /* console.log({
        el,
        head: this.document.head,
      }); */
    });
  }
}
